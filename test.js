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
