-- Friend requests and friend read access for stats
-- Run after 008_profiles.sql

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair
  ON friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_friends ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status IN ('pending', 'accepted')
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = profiles.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = profiles.user_id)
        )
    )
  );

CREATE POLICY friendships_select ON friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY friendships_delete ON friendships
  FOR DELETE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Helper: accepted friendship between current user and row owner
CREATE OR REPLACE FUNCTION public.is_accepted_friend(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = target_user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = target_user_id)
      )
  );
$$;

-- Friend read access for stats (SELECT only)
CREATE POLICY tags_select_friends ON tags
  FOR SELECT USING (public.is_accepted_friend(user_id));

CREATE POLICY time_entries_select_friends ON time_entries
  FOR SELECT USING (public.is_accepted_friend(user_id));

CREATE POLICY time_entry_tags_select_friends ON time_entry_tags
  FOR SELECT USING (public.is_accepted_friend(user_id));

CREATE POLICY geofences_select_friends ON geofences
  FOR SELECT USING (public.is_accepted_friend(user_id));

-- RPC: send friend request by email
CREATE OR REPLACE FUNCTION public.send_friend_request(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  target_id UUID;
  normalized_email TEXT := lower(trim(target_email));
  existing friendships%ROWTYPE;
  new_id UUID;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT user_id INTO target_id
  FROM profiles
  WHERE lower(email) = normalized_email
  LIMIT 1;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No account found with that email';
  END IF;

  IF target_id = me THEN
    RAISE EXCEPTION 'You cannot add yourself';
  END IF;

  SELECT * INTO existing
  FROM friendships
  WHERE LEAST(requester_id, addressee_id) = LEAST(me, target_id)
    AND GREATEST(requester_id, addressee_id) = GREATEST(me, target_id)
  LIMIT 1;

  IF FOUND THEN
    IF existing.status = 'accepted' THEN
      RAISE EXCEPTION 'You are already friends';
    ELSIF existing.status = 'pending' THEN
      IF existing.requester_id = me THEN
        RAISE EXCEPTION 'Friend request already sent';
      ELSE
        RAISE EXCEPTION 'That user already sent you a request';
      END IF;
    ELSIF existing.status = 'declined' THEN
      IF existing.requester_id = me THEN
        UPDATE friendships
        SET status = 'pending', updated_at = now()
        WHERE id = existing.id;
        RETURN existing.id;
      ELSE
        DELETE FROM friendships WHERE id = existing.id;
      END IF;
    END IF;
  END IF;

  INSERT INTO friendships (requester_id, addressee_id, status, updated_at)
  VALUES (me, target_id, 'pending', now())
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- RPC: accept or decline incoming request
CREATE OR REPLACE FUNCTION public.respond_friend_request(friendship_id UUID, accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_rec friendships%ROWTYPE;
BEGIN
  SELECT * INTO friend_rec FROM friendships WHERE id = friendship_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found';
  END IF;

  IF friend_rec.addressee_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the recipient can respond to this request';
  END IF;

  IF friend_rec.status <> 'pending' THEN
    RAISE EXCEPTION 'This request is no longer pending';
  END IF;

  UPDATE friendships
  SET status = CASE WHEN accept THEN 'accepted' ELSE 'declined' END,
      updated_at = now()
  WHERE id = friendship_id;
END;
$$;

-- RPC: cancel outgoing pending or remove accepted friend
CREATE OR REPLACE FUNCTION public.remove_friend(friendship_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_rec friendships%ROWTYPE;
BEGIN
  SELECT * INTO friend_rec FROM friendships WHERE id = friendship_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  IF friend_rec.requester_id <> auth.uid() AND friend_rec.addressee_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF friend_rec.status = 'pending' AND friend_rec.requester_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the sender can cancel a pending request';
  END IF;

  DELETE FROM friendships WHERE id = friendship_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_friend_request(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_friend_request(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_accepted_friend(UUID) TO authenticated;
