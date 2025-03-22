import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { OTPInput } from "./OTPInput";

describe("OTPInput Component", () => {
  test("renders the correct number of inputs", () => {
    const { getAllByTestId } = render(<OTPInput numberOfDigits={6} />);
    expect(getAllByTestId("otp-input")).toHaveLength(6);
  });

  test("handles text input correctly", () => {
    const handleTextChange = jest.fn();
    const { getByTestId } = render(<OTPInput onTextChange={handleTextChange} numberOfDigits={4} />);
    
    fireEvent.changeText(getByTestId("otp-input-hidden"), "1234");
    expect(handleTextChange).toHaveBeenCalledWith("1234");
  });

  test("hides characters when secureTextEntry is enabled", () => {
    const { getAllByText } = render(<OTPInput numberOfDigits={4} secureTextEntry />);
    expect(getAllByText("•")).toHaveLength(0);
  });

  test("triggers onFilled when OTP is complete", () => {
    const onFilled = jest.fn();
    const { getByTestId } = render(<OTPInput numberOfDigits={4} onFilled={onFilled} />);
    
    fireEvent.changeText(getByTestId("otp-input-hidden"), "1234");
    expect(onFilled).toHaveBeenCalledWith("1234");
  });

  test("focuses on tap", () => {
    const { getByTestId } = render(<OTPInput numberOfDigits={4} />);
    const input = getByTestId("otp-input-hidden");
    
    fireEvent.press(getByTestId("otp-input"));
    expect(input.props.autoFocus).toBeTruthy();
  });
});



inpu:
import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const regexMap = {
  alpha: /[^a-zA-Z]/,
  numeric: /[^\d]/,
  alphanumeric: /[^a-zA-Z\d]/,
};

export const OTPInput = forwardRef((props, ref) => {
  const {
    numberOfDigits = 6,
    autoFocus = true,
    focusColor = "#A4D0A4",
    onTextChange,
    onFilled,
    onFocus,
    onBlur,
    blurOnFilled,
    hideStick,
    focusStickBlinkingDuration = 350,
    secureTextEntry = false,
    theme = {},
    disabled,
    textInputProps,
    textProps,
    type = "numeric",
    placeholder: _placeholder,
  } = props;

  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(autoFocus);
  const inputRef = useRef(null);
  const focusedInputIndex = text.length;

  const placeholder = useMemo(
    () => (_placeholder?.length === 1 ? _placeholder.repeat(numberOfDigits) : _placeholder),
    [_placeholder, numberOfDigits]
  );

  useImperativeHandle(ref, () => ({
    clear: () => setText(""),
    focus: () => inputRef.current?.focus(),
    setValue: (value) => handleTextChange(value.slice(0, numberOfDigits)),
  }));

  const handlePress = () => {
    if (!Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    inputRef.current?.focus();
  };

  const handleTextChange = (value) => {
    if (type && regexMap[type].test(value)) return;
    if (disabled) return;
    setText(value);
    onTextChange?.(value);
    if (value.length === numberOfDigits) {
      onFilled?.(value);
      blurOnFilled && inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={[styles.container, theme.containerStyle, theme.inputsContainerStyle]}>
      {Array.from({ length: numberOfDigits }).map((_, index) => {
        const isPlaceholderCell = !!placeholder && !text?.[index];
        const char = isPlaceholderCell ? placeholder?.[index] || " " : text[index];
        const isFocusedInput = index === focusedInputIndex && !disabled && isFocused;
        const isFilledLastInput = text.length === numberOfDigits && index === text.length - 1;
        const isFocusedContainer = isFocusedInput || isFilledLastInput;

        return (
          <Pressable
            key={`${char}-${index}`}
            disabled={disabled}
            onPress={handlePress}
            style={[
              styles.codeContainer,
              theme.pinCodeContainerStyle,
              isFocusedContainer && { borderColor: focusColor },
              isFocusedContainer && theme.focusedPinCodeContainerStyle,
              Boolean(char) && theme.filledPinCodeContainerStyle,
              disabled && theme.disabledPinCodeContainerStyle,
            ]}
            testID="otp-input"
          >
            {isFocusedInput && !hideStick ? (
              <VerticalStick
                focusColor={focusColor}
                focusStickBlinkingDuration={focusStickBlinkingDuration}
                style={theme.focusStickStyle}
              />
            ) : (
              <Text
                {...textProps}
                style={[
                  styles.codeText,
                  theme.pinCodeTextStyle,
                  isPlaceholderCell ? { opacity: 0.5, ...theme.placeholderTextStyle } : {},
                ]}
              >
                {char && secureTextEntry ? "•" : char}
              </Text>
            )}
          </Pressable>
        );
      })}
      <TextInput
        value={text}
        onChangeText={handleTextChange}
        maxLength={numberOfDigits}
        inputMode={type === "numeric" ? type : "text"}
        textContentType="oneTimeCode"
        ref={inputRef}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        editable={!disabled}
        testID="otp-input-hidden"
        onFocus={handleFocus}
        onBlur={handleBlur}
        caretHidden={Platform.OS === "ios"}
        {...textInputProps}
        style={[styles.hiddenInput, textInputProps?.style]}
      />
    </View>
  );
});

const VerticalStick = ({ focusColor, style, focusStickBlinkingDuration }) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0, duration: focusStickBlinkingDuration, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: focusStickBlinkingDuration, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <View style={[styles.stick, focusColor ? { backgroundColor: focusColor } : {}, style]} testID="otp-input-stick" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  codeContainer: { borderWidth: 1, borderRadius: 12, borderColor: "#DFDFDE", height: 60, width: 44, justifyContent: "center", alignItems: "center" },
  codeText: { fontSize: 28 },
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: Platform.select({ ios: 0.02, default: 0 }) },
  stick: { width: 2, height: 30, backgroundColor: "green" },
});
