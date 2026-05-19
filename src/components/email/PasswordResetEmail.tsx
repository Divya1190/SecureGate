import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name?: string | null;
  url: string;
}

export const PasswordResetEmail = ({ name, url }: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your SecureGate password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>SecureGate</Heading>
          <Text style={paragraph}>Hello {name || "there"},</Text>
          <Text style={paragraph}>
            We received a request to reset your password for your SecureGate
            account. You can complete the reset by clicking the secure button below:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Reset Password
            </Button>
          </Section>
          <Text style={paragraph}>
            This password reset link will expire in 1 hour and can only be used once.
            If you did not request a password reset, you can safely ignore this
            email. Your password will remain unchanged.
          </Text>
          <Text style={footer}>
            SecureGate Identity Management • Secure by Default
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

const main = {
  backgroundColor: "#0f1117",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#1a1d27",
  border: "1px solid #2e3248",
  borderRadius: "12px",
  margin: "0 auto",
  padding: "40px 30px",
  width: "560px",
};

const heading = {
  color: "#6366f1",
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#e8eaf0",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px 0",
};

const buttonContainer = {
  margin: "30px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "100%",
  padding: "14px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const footer = {
  color: "#8b90a8",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "30px 0 0 0",
  textAlign: "center" as const,
};
