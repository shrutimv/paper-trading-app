// components/HorizontalCardCarousel.tsx
import React from "react";
import {
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    useWindowDimensions,
    View
} from "react-native";

type Props = {
  children: React.ReactNode;
  cardWidth?: number; // optional override
  cardSpacing?: number; // space between cards
};

/**
 * HorizontalCardCarousel
 *
 * Simple horizontal draggable / snapping carousel using ScrollView + Animated.
 * It uses snapToInterval so dragging snaps to card width + spacing.
 */
export default function HorizontalCardCarousel({
  children,
  cardWidth,
  cardSpacing = 12,
}: Props) {
  const { width: screenW } = useWindowDimensions();

  // default card width: ~45% of screen or provided override
  const defaultCardW = Math.round(screenW * 0.46);
  const itemW = cardWidth ?? defaultCardW;
  const snapInterval = itemW + cardSpacing;

  // animated value (optional if you want indicators later)
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // (optional) you can expose current index by listening to scroll end:
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // const offsetX = e.nativeEvent.contentOffset.x;
    // const index = Math.round(offsetX / snapInterval);
    // console.log("active index:", index);
  };

  return (
    <View style={styles.wrapper}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: 16,
          alignItems: "center",
        }}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {/* Each child should be a card element; we add spacing to each */}
        {React.Children.map(children, (child, idx) => (
          <View key={idx} style={{ width: itemW, marginRight: cardSpacing }}>
            {child}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
});
