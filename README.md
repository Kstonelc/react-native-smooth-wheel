# @kstonelc/react-native-smooth-wheel

🎡 A smooth, all TypeScript wheel picker for React Native — **No Native Code Required**.

[![null](https://img.shields.io/npm/v/@kstonelc/react-native-smooth-wheel.svg)](https://www.npmjs.com/package/@kstonelc/react-native-smooth-wheel)

------

## 🔎  Demo

<video src="https://yrdata-1315719510.cos.ap-shanghai.myqcloud.com/images/react-native-smooth-wheel-demo.mp4" style="width: 300px;height: 600px"></video>

## ✨ Features

- Pure TypeScript/JavaScript, no native code, support Android and IOS
- Smooth wheel animation
- Customizable text style & highlight
- Supports tap-to-select
- Works with React Native >= 0.73

------

## 📦 Installation

```bash
npm install @kstonelc/react-native-smooth-wheel
# or
yarn add @kstonelc/react-native-smooth-wheel
```



## 🚀 Usage

```jsx
const data = [
    {
      text: 'React Native',
      value: 'React Native',
    },
    {
      text: 'Flutter',
      value: 'Flutter',
    },
    {
      text: 'Uniapp',
      value: 'Uniapp',
    },
    {
      text: 'Taro',
      value: 'Taro',
    },
    {
      text: 'Ionic',
      value: 'Ionic',
    },
  ];
const [value, setValue] = useState(null);
<WheelPicker
  key={1}
  data={data}
  value={value}
  defaultValue={'React native'}
  centerOverlayStyle={{
    backgroundColor: '#D4E639',
  }}
  onChange={(item, index) => {
    console.log('item', item);
    console.log('index', index);
    setValue(item.value);
  }}
/>
```

> **Note:** When setting `renderItem`, make sure its height is consistent with the `itemHeight` parameter, otherwise scrolling may be misaligned. This issue will be fixed in a future release

| Prop                 | Type                             | Default                                   | Description                   |
| -------------------- | -------------------------------- | ----------------------------------------- | ----------------------------- |
| `data`               | `{ text: string; value: any }[]` | -                                         | List items                    |
| `value`              | `any`                            | -                                         | Controlled value              |
| `defaultIndex`       | `number`                         | 0                                         | Initial index if uncontrolled |
| `onChange`           | `(item, index) => void`          | -                                         | Called when selection changes |
| `itemHeight`         | `number`                         | 40                                        | Row height                    |
| `visibleCount`       | `number`                         | 5                                         | Visible rows                  |
| `activeTextColor`    | `string`                         | "black"                                   | Active text color             |
| `inactiveTextColor`  | `string`                         | "#B5B5B5"                                 | Inactive text color           |
| `enableTapSelect`    | `boolean`                        | true                                      | Tap row to select             |
| `renderItem`         | `(info) => ReactElement`         | -                                         | Custom row renderer           |
| `centerOverlayStyle` | `ViewStyle`                      | `{ backgroundColor: "rgba(0,0,0,0.07)" }` | Highlight layer               |

