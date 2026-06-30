import { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';

export const HERO_ENTER = SlideInLeft.duration(480)
  .springify()
  .damping(20)
  .stiffness(140)
  .withInitialValues({ opacity: 0 });

export const CARD_ENTER = SlideInRight.duration(520)
  .delay(220)
  .springify()
  .damping(20)
  .stiffness(140)
  .withInitialValues({ opacity: 0 });

export const CARD_FADE = FadeIn.duration(900);

export const CARD_CONTENT_DELAY = 520;
export const CARD_STAGGER = 100;
