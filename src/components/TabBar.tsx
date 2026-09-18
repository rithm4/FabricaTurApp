import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Text } from './Text';
import { useReducedMotion } from './Press';
import { useApp, type ScreenName } from '../AppState';
import { colors, gradients, space, type } from '../theme';
import { Icon, type IconName } from './Icon';

type TabDef = { target: ScreenName; icon: IconName; label: string };

/** Raza cercului activ. */
const R_BUBBLE = 26;
/** Spațiul dintre cerc și marginea scobiturii, prin care se vede fundalul. */
const GAP = 5;
/** Raza scobiturii din bară. */
const R_NOTCH = R_BUBBLE + GAP;
/** Rotunjirea umerilor, acolo unde marginea dreaptă coboară în scobitură. */
const FILLET = 8;
/** Loc deasupra barei pentru jumătatea de sus a cercului. */
const TOP = R_BUBBLE + 4;
const BAR_H = 72;
const CORNER = 24;
/** Tab-urile se țin departe de colțuri, ca scobitura tabului din margine să încapă. */
const SIDE = 16;
/** Loc sub bară pentru umbră. */
const SHADOW_ROOM = 8;

/**
 * Umbra, ca straturi ale aceleiași forme coborâte treptat. Pe web, o umbră obișnuită ar fi
 * desenată ca dreptunghi, nu pe conturul cu scobitură; mai multe straturi foarte slabe dau
 * o margine care se estompează, în loc de o copie tăiată.
 */
const SHADOW_LAYERS = [
  { y: 1, opacity: 0.035 },
  { y: 2.5, opacity: 0.035 },
  { y: 4.5, opacity: 0.03 },
  { y: 7, opacity: 0.02 },
];

/**
 * Conturul barei: dreptunghi rotunjit, cu o scobitură concavă sub tabul activ.
 *
 * Umerii scobiturii sunt arce mici, tangente atât la marginea de sus, cât și la scobitură,
 * așa că linia coboară lin în adâncitură, fără colț. Cercul activ stă cu centrul pe marginea
 * barei: jumătate deasupra, jumătate în scobitură.
 */
function barPath(width: number, cx: number | null) {
  const T = TOP;
  const B = TOP + BAR_H;
  const bottomEdge = [
    `L ${width} ${B - CORNER}`,
    `Q ${width} ${B} ${width - CORNER} ${B}`,
    `L ${CORNER} ${B}`,
    `Q 0 ${B} 0 ${B - CORNER}`,
    'Z',
  ];

  if (cx === null) {
    return [
      `M 0 ${T + CORNER}`,
      `Q 0 ${T} ${CORNER} ${T}`,
      `L ${width - CORNER} ${T}`,
      `Q ${width} ${T} ${width} ${T + CORNER}`,
      ...bottomEdge,
    ].join(' ');
  }

  // Unde începe umărul pe marginea de sus, și unde întâlnește scobitura.
  const a = Math.sqrt(R_NOTCH * R_NOTCH + 2 * R_NOTCH * FILLET);
  const tx = (a * R_NOTCH) / (R_NOTCH + FILLET);
  const ty = (FILLET * R_NOTCH) / (R_NOTCH + FILLET);

  // La tabul din margine, colțul se strânge cât e nevoie ca să nu se calce cu scobitura.
  const cL = Math.max(0, Math.min(CORNER, cx - a));
  const cR = Math.max(0, Math.min(CORNER, width - (cx + a)));

  return [
    `M 0 ${T + cL}`,
    `Q 0 ${T} ${cL} ${T}`,
    `L ${cx - a} ${T}`,
    `A ${FILLET} ${FILLET} 0 0 1 ${cx - tx} ${T + ty}`,
    `A ${R_NOTCH} ${R_NOTCH} 0 0 0 ${cx + tx} ${T + ty}`,
    `A ${FILLET} ${FILLET} 0 0 1 ${cx + a} ${T}`,
    `L ${width - cR} ${T}`,
    `Q ${width} ${T} ${width} ${T + cR}`,
    ...bottomEdge,
  ].join(' ');
}

function Tab({ tab, active }: { tab: TabDef; active: boolean }) {
  const { go, screen } = useApp();

  const choose = () => {
    // Tabul poate fi activ și când ești într-un ecran din interiorul lui (ex. Setări notificări);
    // atunci apăsarea trebuie să te readucă la el, nu să fie ignorată.
    if (screen === tab.target) return;
    // O vibrație scurtă confirmă atingerea. Pe web nu există, deci n-o cerem.
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    go(tab.target);
  };

  return (
    <Pressable
      onPress={choose}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      style={({ pressed }) => [styles.tab, pressed && screen !== tab.target && styles.tabPressed]}
    >
      {/* Locul iconiței rămâne ocupat și la tabul activ, ca etichetele să stea pe aceeași linie. */}
      <View style={styles.iconSlot}>
        {active ? null : <Icon name={tab.icon} size={23} color={colors.muted} />}
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

/**
 * Bara de navigație, cu tabul activ așezat pe jumătate într-o scobitură a barei.
 *
 * Scobitura și cercul se mișcă împreună, ca un singur obiect: la schimbarea tabului
 * alunecă spre noua poziție în loc să dispară dintr-un loc și să apară în altul.
 * Etichetele rămân pe toate tab-urile — o iconiță singură e o ghicitoare la 50+ ani.
 */
export function TabBar() {
  const { t, screen } = useApp();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);

  const tabs: TabDef[] = [
    { target: 'home', icon: 'home', label: t.tabHome },
    { target: 'list', icon: 'waves', label: t.tabResorts },
    { target: 'notif', icon: 'bell', label: t.tabNotif },
    { target: 'profile', icon: 'user', label: t.tabProfile },
  ];
  // Ecranele din interiorul unui tab îl țin pe acela activ, ca omul să știe de unde a intrat.
  const parent: Partial<Record<ScreenName, ScreenName>> = {
    notifSettings: 'profile',
    bookings: 'profile',
  };
  const current = parent[screen] ?? screen;
  const activeIndex = tabs.findIndex((tab) => tab.target === current);
  const activeIcon = activeIndex >= 0 ? tabs[activeIndex].icon : null;

  const tabW = (width - SIDE * 2) / tabs.length;
  const target = width > 0 && activeIndex >= 0 ? SIDE + tabW * activeIndex + tabW / 2 : null;

  // Poziția orizontală a scobiturii, animată. Drumul SVG se redesenează la fiecare cadru,
  // deci valoarea e citită în JavaScript — de aici `useNativeDriver: false`.
  const cxAnim = useRef(new Animated.Value(0)).current;
  const [cx, setCx] = useState<number | null>(null);
  const placed = useRef(false);

  useEffect(() => {
    const id = cxAnim.addListener(({ value }) => setCx(value));
    return () => cxAnim.removeListener(id);
  }, [cxAnim]);

  useEffect(() => {
    if (target === null) {
      setCx(null);
      placed.current = false;
      return;
    }
    // Prima așezare și mișcarea redusă sar direct în poziție.
    if (!placed.current || reduced) {
      cxAnim.setValue(target);
      setCx(target);
      placed.current = true;
      return;
    }
    Animated.spring(cxAnim, {
      toValue: target,
      useNativeDriver: false,
      speed: 14,
      bounciness: 5,
    }).start();
  }, [target, reduced, cxAnim]);

  const d = width > 0 ? barPath(width, cx) : '';

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View style={styles.frame} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={TOP + BAR_H + SHADOW_ROOM} style={StyleSheet.absoluteFill}>
            {SHADOW_LAYERS.map((layer) => (
              <Path
                key={layer.y}
                d={d}
                fill={`rgba(27,44,94,${layer.opacity})`}
                transform={`translate(0, ${layer.y})`}
              />
            ))}
            {/* Contur abia vizibil: definește scobitura fără să dea aer de schiță tehnică. */}
            <Path d={d} fill={colors.white} stroke="rgba(27,44,94,0.07)" strokeWidth={1} />
          </Svg>
        )}

        <View style={styles.row}>
          {tabs.map((tab, i) => (
            <Tab key={tab.target} tab={tab} active={i === activeIndex} />
          ))}
        </View>

        {/* Cercul stă deasupra rândului și alunecă odată cu scobitura. */}
        {cx !== null && activeIcon && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              { transform: [{ translateX: Animated.subtract(cxAnim, R_BUBBLE) }] },
            ]}
          >
            <LinearGradient
              colors={gradients.water}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bubbleFill}
            >
              {/* Lumina de sus dă volum cercului, ca unui buton de sticlă. */}
              <LinearGradient
                colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                locations={[0, 0.55]}
                style={styles.bubbleShine}
              />
              <Icon name={activeIcon} size={24} color={colors.white} />
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.xs },
  frame: { height: TOP + BAR_H + SHADOW_ROOM },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TOP,
    height: BAR_H,
    paddingHorizontal: SIDE,
    flexDirection: 'row',
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: space.md },
  tabPressed: { opacity: 0.5 },
  iconSlot: { height: 26, alignItems: 'center', justifyContent: 'center' },
  label: { ...type.micro, fontWeight: '500', color: colors.muted, marginTop: 4 },
  labelActive: { color: colors.navy, fontWeight: '600' },

  // Centrul cercului stă exact pe marginea de sus a barei.
  bubble: {
    position: 'absolute',
    top: TOP - R_BUBBLE,
    left: 0,
    width: R_BUBBLE * 2,
    height: R_BUBBLE * 2,
    borderRadius: R_BUBBLE,
    shadowColor: '#1B2C5E',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  bubbleFill: {
    flex: 1,
    borderRadius: R_BUBBLE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Margine translucidă: separă cercul de fundal și îi dă un contur de sticlă.
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  bubbleShine: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
});
