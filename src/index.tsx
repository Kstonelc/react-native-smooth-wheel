import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  View,
  Animated,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
  ListRenderItemInfo,
  FlatList,
  Platform,
} from "react-native";

type Item = { text: string; value: any };

export type WheelPickerRef = {
  scrollToIndex: (index: number, animated?: boolean) => void;
};

type Props = {
  data: Item[]; // 数据 [{ text: string; value: any },...]
  value?: any; // 受控值（可选）
  defaultIndex?: number; // 非受控初始索引
  onChange?: (item: Item, index: number) => void;
  itemHeight?: number; // 单行高度
  visibleCount?: number; // 可见行数
  style?: ViewStyle;
  css?: ViewStyle;
  textStyle?: TextStyle;
  activeTextColor?: string;
  inactiveTextColor?: string;
  enableTapSelect?: boolean; // 点击任意行自动滚动并选中
  renderItem?: (info: {
    item: Item;
    index: number;
    isActive: boolean;
  }) => React.ReactElement | null;
  centerOverlayStyle?: ViewStyle; // 选中高亮层样式
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const WheelPicker = forwardRef<WheelPickerRef, Props>((props, ref) => {
  const {
    data,
    value,
    defaultIndex = 0,
    onChange,
    itemHeight = 40,
    visibleCount = 5,
    css,
    style,
    textStyle,
    activeTextColor = "white",
    inactiveTextColor = "white",
    enableTapSelect = true,
    renderItem,
    centerOverlayStyle,
  } = props;

  const listRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [laidOut, setLaidOut] = useState(false); // IOS需要等待布局完成再进行操作

  const skipNextMomentumRef = useRef(false);

  // 组件高度 = 行高 * 可见行数（建议奇数）
  const containerH = useMemo(
    () => itemHeight * visibleCount,
    [itemHeight, visibleCount],
  );

  // 顶/底内边距让“选中行”在中间
  const sidePad = useMemo(
    () => (containerH - itemHeight) / 2,
    [containerH, itemHeight],
  );

  // 当前选中索引（通过 contentOffset.y 推导），最终在动量结束时锁定,保证索引不会越界
  const currentIndexRef = useRef(clamp(defaultIndex ?? 0, 0, data.length - 1));

  // 受控
  useEffect(() => {
    if (value === undefined) return;
    const i = data.findIndex((it) => it.value === value);
    if (i >= 0) {
      currentIndexRef.current = i;
      if (!laidOut) return;
      listRef.current?.scrollToOffset({
        offset: i * itemHeight,
        animated: true,
      });
    }
  }, [value, data, itemHeight, laidOut]);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      const i = clamp(index, 0, data.length - 1);
      listRef.current?.scrollToOffset({ offset: i * itemHeight, animated });
    },
  }));

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );

  // 惯性滚动停止之后触发
  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y as number;
      const index = clamp(Math.round(y / itemHeight), 0, data.length - 1);

      if (!skipNextMomentumRef.current) {
        if (index !== currentIndexRef.current) {
          currentIndexRef.current = index;
          onChange?.(data[index], index);
        }
      }
      skipNextMomentumRef.current = false;
      // 不触发动画 直接对齐
      const aligned = index * itemHeight;
      if (Math.abs(aligned - y) > 0.5) {
        listRef.current?.scrollToOffset({ offset: aligned, animated: false });
      }
    },
    [itemHeight, data, onChange],
  );

  // 点击行滚动并触发变更
  const handlePressItem = useCallback(
    (index: number) => {
      if (!enableTapSelect) return;
      skipNextMomentumRef.current = true;
      currentIndexRef.current = index;
      listRef.current?.scrollToOffset({
        offset: index * itemHeight,
        animated: true,
      });
      onChange?.(data[index], index);
    },
    [enableTapSelect, itemHeight, data, onChange],
  );

  // 每行渲染：根据距中心的“行距”做插值
  const renderRow = useCallback(
    ({ item, index }: ListRenderItemInfo<Item>) => {
      // 这一行距离中心差多少行
      const rel = Animated.divide(
        Animated.subtract(index * itemHeight, scrollY),
        itemHeight,
      );

      const scale = rel.interpolate({
        inputRange: [-3, -2, -1, 0, 1, 2, 3],
        outputRange: [0.85, 0.9, 0.95, 1.0, 0.95, 0.9, 0.85],
        extrapolate: "clamp",
      });

      const opacity = rel.interpolate({
        inputRange: [-3, -2, -1, 0, 1, 2, 3],
        outputRange: [0.15, 0.3, 0.6, 1.0, 0.6, 0.3, 0.15],
        extrapolate: "clamp",
      });

      // 中心±0.5 行视作激活
      const isActiveApproximated =
        Math.abs((currentIndexRef.current ?? 0) - index) < 0.5;

      const finalOpacity = isActiveApproximated ? 1 : opacity;

      const line = (
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.itemText,
            {
              lineHeight: itemHeight,
              color: isActiveApproximated ? activeTextColor : inactiveTextColor,
            },
            textStyle,
            { transform: [{ scale }], opacity: finalOpacity },
          ]}
          accessibilityRole="button"
          accessible
          accessibilityState={{ selected: isActiveApproximated }}
        >
          {item.text}
        </Animated.Text>
      );

      if (!enableTapSelect) {
        return (
          <View style={{ height: itemHeight, alignItems: "center" }}>
            {line}
          </View>
        );
      }
      return (
        <Pressable
          onPress={() => handlePressItem(index)}
          style={{ height: itemHeight, alignItems: "center" }}
        >
          {line}
        </Pressable>
      );
    },
    [
      activeTextColor,
      inactiveTextColor,
      itemHeight,
      sidePad,
      scrollY,
      textStyle,
      enableTapSelect,
      handlePressItem,
    ],
  );

  const keyExtractor = useCallback(
    (it: Item, i: number) => `${i}-${String(it.value)}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: any, i: number) => ({
      length: itemHeight,
      offset: i * itemHeight,
      index: i,
    }),
    [itemHeight],
  );

  const onContainerLayout = useCallback((_e: LayoutChangeEvent) => {
    setLaidOut(true);
  }, []);

  const initialIndex = clamp(defaultIndex ?? 0, 0, data.length - 1);

  return (
    <View
      style={[{ height: containerH }, css, style]}
      onLayout={onContainerLayout}
    >
      <View
        pointerEvents="none"
        style={[
          styles.centerOverlay,
          {
            top: sidePad,
            height: itemHeight,
            borderRadius: 12,
            zIndex: 0,
          },
          centerOverlayStyle,
        ]}
      />

      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={
          renderItem
            ? (info) =>
                renderItem({
                  item: info.item,
                  index: info.index,
                  isActive: info.index === currentIndexRef.current,
                })
            : renderRow
        }
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: sidePad,
          paddingBottom: sidePad,
        }}
        getItemLayout={getItemLayout}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        removeClippedSubviews={Platform.OS !== "ios"} // IOS优化
        initialNumToRender={visibleCount + 4}
        initialScrollIndex={initialIndex}
        onScrollToIndexFailed={({ index }) => {
          const offset = index * itemHeight;
          listRef.current?.scrollToOffset({ offset, animated: false });
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  itemText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  centerOverlay: {
    position: "absolute",
    left: 8,
    right: 8,
  },
});

export default WheelPicker;
