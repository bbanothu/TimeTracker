import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 200;
const VIEW = 100;

const DRAIN_END = 0.68;
const PAUSE_END = 0.76;
const DRAIN_MS = 2500;
const PAUSE_MS = 250;
const FLIP_MS = 750;

const FRAME = {
  topY: 10,
  bottomY: 90,
  leftX: 24,
  rightX: 76,
  centerX: 50,
  neckY: 50,
  neckHalf: 3,
};

const GOLD = '#FFB347';
const GOLD_BRIGHT = '#FFDD73';

type SandParticle = { cx: number; cy: number; r: number; o: number; phase: number };

function buildTopSandParticles(): SandParticle[] {
  const particles: SandParticle[] = [];
  const sandBottom = FRAME.neckY - 2;
  const sandTop = FRAME.topY + 12;
  for (let row = 0; row < 9; row++) {
    const t = row / 8;
    const y = sandTop + t * (sandBottom - sandTop);
    const halfWidth = 3 + (1 - t) * 21;
    const cols = 2 + Math.floor((1 - t) * 7);
    for (let col = 0; col < cols; col++) {
      const x =
        FRAME.centerX -
        halfWidth +
        (cols === 1 ? 0 : (2 * halfWidth * col) / (cols - 1)) +
        ((row + col) % 2) * 0.6 -
        0.3;
      particles.push({
        cx: x,
        cy: y + (col % 3) * 0.35,
        r: 0.22 + (row % 4) * 0.12,
        o: 0.45 + (row % 5) * 0.1,
        phase: (row * 0.11 + col * 0.07) % 1,
      });
    }
  }
  return particles;
}

function buildBottomSandParticles(): SandParticle[] {
  const particles: SandParticle[] = [];
  const sandTop = FRAME.neckY + 2;
  const sandBottom = FRAME.bottomY - 2;
  for (let row = 0; row < 8; row++) {
    const t = row / 7;
    const y = sandBottom - t * (sandBottom - sandTop);
    const halfWidth = 3 + t * 21;
    const cols = 2 + Math.floor(t * 7);
    for (let col = 0; col < cols; col++) {
      const x =
        FRAME.centerX -
        halfWidth +
        (cols === 1 ? 0 : (2 * halfWidth * col) / (cols - 1)) +
        ((row + col) % 2) * 0.5;
      particles.push({
        cx: x,
        cy: y,
        r: 0.2 + (row % 3) * 0.14,
        o: 0.4 + (row % 4) * 0.12,
        phase: (row * 0.09 + col * 0.13) % 1,
      });
    }
  }
  return particles;
}

const TOP_PARTICLES = buildTopSandParticles();
const BOTTOM_PARTICLES = buildBottomSandParticles();
const STREAM_PHASES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.62, 0.74, 0.86];
const AMBIENT_SPARKLES = [
  { cx: 34, cy: 20, r: 0.35, phase: 0.1 },
  { cx: 64, cy: 24, r: 0.3, phase: 0.45 },
  { cx: 40, cy: 36, r: 0.28, phase: 0.7 },
  { cx: 60, cy: 64, r: 0.32, phase: 0.25 },
  { cx: 42, cy: 78, r: 0.26, phase: 0.55 },
  { cx: 58, cy: 80, r: 0.3, phase: 0.85 },
];

function framePath(): string {
  const { topY, bottomY, leftX, rightX, centerX, neckY, neckHalf } = FRAME;
  const nL = centerX - neckHalf;
  const nR = centerX + neckHalf;
  return [
    `M ${leftX} ${topY} H ${rightX}`,
    `M ${rightX} ${topY} C ${rightX} ${topY + 24}, ${nR + 12} ${neckY - 10}, ${nR} ${neckY}`,
    `M ${nR} ${neckY} C ${nR + 12} ${neckY + 10}, ${rightX} ${bottomY - 24}, ${rightX} ${bottomY}`,
    `M ${rightX} ${bottomY} H ${leftX}`,
    `M ${leftX} ${bottomY} C ${leftX} ${bottomY - 24}, ${nL - 12} ${neckY + 10}, ${nL} ${neckY}`,
    `M ${nL} ${neckY} C ${nL - 12} ${neckY - 10}, ${leftX} ${topY + 24}, ${leftX} ${topY}`,
  ].join(' ');
}

function topBulbClip(): string {
  const { topY, leftX, rightX, centerX, neckY, neckHalf } = FRAME;
  const nL = centerX - neckHalf;
  const nR = centerX + neckHalf;
  return [
    `M ${leftX + 1} ${topY + 1}`,
    `H ${rightX - 1}`,
    `C ${rightX - 1} ${topY + 24}, ${nR + 11} ${neckY - 9}, ${nR} ${neckY}`,
    `L ${nL} ${neckY}`,
    `C ${nL - 11} ${neckY - 9}, ${leftX + 1} ${topY + 24}, ${leftX + 1} ${topY + 1}`,
    'Z',
  ].join(' ');
}

function bottomBulbClip(): string {
  const { bottomY, leftX, rightX, centerX, neckY, neckHalf } = FRAME;
  const nL = centerX - neckHalf;
  const nR = centerX + neckHalf;
  return [
    `M ${nL} ${neckY}`,
    `C ${nL - 11} ${neckY + 9}, ${leftX + 1} ${bottomY - 24}, ${leftX + 1} ${bottomY - 1}`,
    `H ${rightX - 1}`,
    `C ${rightX - 1} ${bottomY - 24}, ${nR + 11} ${neckY + 9}, ${nR} ${neckY}`,
    'Z',
  ].join(' ');
}

function sandAmount(cycle: number): number {
  'worklet';
  if (cycle >= DRAIN_END) return 1;
  return cycle / DRAIN_END;
}

function flipRotation(cycle: number): number {
  'worklet';
  if (cycle <= PAUSE_END) return 0;
  return ((cycle - PAUSE_END) / (1 - PAUSE_END)) * 180;
}

function drainPhase(cycle: number): number {
  'worklet';
  if (cycle >= DRAIN_END) return 1;
  return cycle / DRAIN_END;
}

function isDraining(cycle: number): boolean {
  'worklet';
  return cycle < DRAIN_END;
}

function topSurfaceY(drain: number): number {
  'worklet';
  return FRAME.topY + 10 + drain * (FRAME.neckY - FRAME.topY - 12);
}

function bottomMoundTop(fill: number): number {
  'worklet';
  return FRAME.bottomY - fill * (FRAME.bottomY - FRAME.neckY - 2);
}

function bottomSpread(fill: number): number {
  'worklet';
  return 2 + fill * 24;
}

interface AnimatedHourglassProps {
  size?: number;
}

export function AnimatedHourglass({ size = SIZE }: AnimatedHourglassProps) {
  const cycle = useSharedValue(0);
  const topParticles = useMemo(() => TOP_PARTICLES, []);
  const bottomParticles = useMemo(() => BOTTOM_PARTICLES, []);

  useEffect(() => {
    cycle.value = withRepeat(
      withSequence(
        withTiming(DRAIN_END, { duration: DRAIN_MS, easing: Easing.linear }),
        withTiming(PAUSE_END, { duration: PAUSE_MS, easing: Easing.linear }),
        withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [cycle]);

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipRotation(cycle.value)}deg` }],
  }));

  const topFillProps = useAnimatedProps(() => {
    const drain = sandAmount(cycle.value);
    if (drain >= 0.999) {
      return { d: 'M 0 0 Z', opacity: 0 };
    }
    const surfaceY = topSurfaceY(drain);
    const nL = FRAME.centerX - FRAME.neckHalf;
    const nR = FRAME.centerX + FRAME.neckHalf;
    const d = [
      `M ${FRAME.leftX + 5} ${surfaceY}`,
      `L ${FRAME.rightX - 5} ${surfaceY}`,
      `L ${nR} ${FRAME.neckY}`,
      `L ${nL} ${FRAME.neckY}`,
      'Z',
    ].join(' ');
    return { d, opacity: 0.18 * (1 - drain * 0.6) };
  });

  const bottomFillProps = useAnimatedProps(() => {
    const fill = sandAmount(cycle.value);
    const moundTop = bottomMoundTop(fill);
    const spread = bottomSpread(fill);
    const d = [
      `M ${FRAME.centerX} ${moundTop}`,
      `L ${FRAME.centerX + spread} ${FRAME.bottomY - 1}`,
      `L ${FRAME.centerX - spread} ${FRAME.bottomY - 1}`,
      'Z',
    ].join(' ');
    return { d, opacity: 0.16 + fill * 0.14 };
  });

  const height = size * 1.15;

  return (
    <View style={{ width: size, height, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height }, flipStyle]}>
        <Svg width={size} height={height} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <Defs>
            <LinearGradient id="sandGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={GOLD} stopOpacity={0.75} />
            </LinearGradient>
            <ClipPath id="topBulb">
              <Path d={topBulbClip()} />
            </ClipPath>
            <ClipPath id="bottomBulb">
              <Path d={bottomBulbClip()} />
            </ClipPath>
          </Defs>

          <Path
            d={framePath()}
            stroke={GOLD}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.22}
          />
          <Path
            d={framePath()}
            stroke={GOLD}
            strokeWidth={1.15}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.95}
          />

          <Path
            d={`M ${FRAME.rightX - 5} ${FRAME.topY + 3} Q ${FRAME.rightX - 10} ${FRAME.topY + 20} ${FRAME.centerX + FRAME.neckHalf + 6} ${FRAME.neckY - 6}`}
            stroke="rgba(255, 235, 190, 0.35)"
            strokeWidth={0.65}
            fill="none"
          />
          <Path
            d={`M ${FRAME.leftX + 5} ${FRAME.bottomY - 3} Q ${FRAME.leftX + 10} ${FRAME.bottomY - 20} ${FRAME.centerX - FRAME.neckHalf - 6} ${FRAME.neckY + 6}`}
            stroke="rgba(255, 235, 190, 0.3)"
            strokeWidth={0.65}
            fill="none"
          />

          <G clipPath="url(#topBulb)">
            <AnimatedPath fill="url(#sandGlow)" animatedProps={topFillProps} />
            {topParticles.map((particle, index) => (
              <TopSandParticle key={`top-${index}`} cycle={cycle} particle={particle} />
            ))}
          </G>

          <G clipPath="url(#bottomBulb)">
            <AnimatedPath fill="url(#sandGlow)" animatedProps={bottomFillProps} />
            {bottomParticles.map((particle, index) => (
              <BottomSandParticle key={`bottom-${index}`} cycle={cycle} particle={particle} />
            ))}
          </G>

          {STREAM_PHASES.map((phase, index) => (
            <StreamDot key={`stream-${index}`} cycle={cycle} phase={phase} index={index} />
          ))}

          {AMBIENT_SPARKLES.map((sparkle, index) => (
            <AmbientSparkle key={`ambient-${index}`} cycle={cycle} {...sparkle} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

function TopSandParticle({
  cycle,
  particle,
}: {
  cycle: SharedValue<number>;
  particle: SandParticle;
}) {
  const animatedProps = useAnimatedProps(() => {
    const drain = sandAmount(cycle.value);
    const surfaceY = topSurfaceY(drain);
    const visible = particle.cy >= surfaceY - 0.5 && particle.cy <= FRAME.neckY + 0.5;
    const twinkle = (Math.sin((drainPhase(cycle.value) + particle.phase) * Math.PI * 4) + 1) / 2;
    return {
      opacity: visible ? particle.o * (0.55 + twinkle * 0.45) : 0,
      r: particle.r * (0.9 + twinkle * 0.25),
    };
  });

  return (
    <AnimatedCircle
      cx={particle.cx}
      cy={particle.cy}
      fill={GOLD_BRIGHT}
      animatedProps={animatedProps}
    />
  );
}

function BottomSandParticle({
  cycle,
  particle,
}: {
  cycle: SharedValue<number>;
  particle: SandParticle;
}) {
  const animatedProps = useAnimatedProps(() => {
    const fill = sandAmount(cycle.value);
    const moundTop = bottomMoundTop(fill);
    const spread = bottomSpread(fill);
    const height = FRAME.bottomY - moundTop;
    const spreadAtY = height <= 0.5 ? 0 : ((particle.cy - moundTop) / height) * spread;
    const visible =
      particle.cy >= moundTop - 0.5 &&
      particle.cy <= FRAME.bottomY &&
      Math.abs(particle.cx - FRAME.centerX) <= spreadAtY + particle.r + 0.5;
    const twinkle = (Math.sin((drainPhase(cycle.value) + particle.phase) * Math.PI * 4) + 1) / 2;
    return {
      opacity: visible ? particle.o * (0.5 + twinkle * 0.5) : 0,
      r: particle.r * (0.85 + twinkle * 0.3),
    };
  });

  return (
    <AnimatedCircle
      cx={particle.cx}
      cy={particle.cy}
      fill={GOLD_BRIGHT}
      animatedProps={animatedProps}
    />
  );
}

function StreamDot({
  cycle,
  phase,
  index,
}: {
  cycle: SharedValue<number>;
  phase: number;
  index: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    if (!isDraining(cycle.value)) {
      return { cy: FRAME.neckY, opacity: 0, r: 0.01 };
    }

    const phaseProgress = drainPhase(cycle.value);
    const t = (phaseProgress + phase) % 1;
    const streamTop = FRAME.neckY - 3;
    const streamBottom = FRAME.neckY + 3;
    const y = streamTop + t * (streamBottom - streamTop);
    const edge = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1;
    const twinkle = (Math.sin((t + index * 0.2) * Math.PI * 6) + 1) / 2;
    return {
      cy: y,
      opacity: edge * (0.55 + twinkle * 0.45),
      r: 0.28 + (index % 3) * 0.1 + twinkle * 0.08,
    };
  });

  return <AnimatedCircle cx={FRAME.centerX} fill={GOLD_BRIGHT} animatedProps={animatedProps} />;
}

function AmbientSparkle({
  cycle,
  cx,
  cy,
  r,
  phase,
}: {
  cycle: SharedValue<number>;
  cx: number;
  cy: number;
  r: number;
  phase: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const wave = (Math.sin((drainPhase(cycle.value) + phase) * Math.PI * 2) + 1) / 2;
    const fade = cycle.value >= DRAIN_END ? 0.35 : 1;
    return {
      opacity: (0.12 + wave * 0.55) * fade,
      r: r * (0.8 + wave * 0.45),
    };
  });

  return <AnimatedCircle cx={cx} cy={cy} fill={GOLD_BRIGHT} animatedProps={animatedProps} />;
}
