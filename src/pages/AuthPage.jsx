import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Form, Input, Button, Alert, message } from "antd";
import { RxPerson, RxEnvelopeClosed, RxLockClosed } from "react-icons/rx";
import { createOrUpdateUserProfile } from "../services/userService";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(auth);
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setIsLogin(location.pathname === "/login");
  }, [location.pathname]);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    navigate(isLogin ? "/signup" : "/login");
    form.resetFields();
    message.destroy();
  };

  const onFinish = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        message.success("Login successful!");
        navigate("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        await updateProfile(userCredential.user, {
          displayName: values.fullName,
        });

        await createOrUpdateUserProfile({
          uid: userCredential.user.uid,
          fullName: values.fullName,
          email: values.email,
        });

        message.success("Account created successfully!");
        navigate("/");
      }
    } catch (err) {
      let errorMessage = "An error occurred. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Prevent flash of form while redirecting authenticated users
  if (user && !loading) return null;

  const inputClasses =
    "!h-11 sm:!h-12 !px-4 !text-sm sm:!text-[15px] !rounded-xl !border-gray-200 hover:!border-gray-300 focus:!border-primary focus:!shadow-[0_0_0_3px_rgba(99,142,255,0.1)] transition-all duration-200";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-bg to-[#e8ecf1]">
      <div className="w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] px-6 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12">
        {/* Header */}
        <div className="text-center mb-7 sm:mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold mb-2 bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-text-muted text-sm sm:text-[15px]">
            {isLogin
              ? "Sign in to your AirforShare account"
              : "Join AirforShare to start sharing files"}
          </p>
        </div>

        {/* Form */}
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          className="mb-0"
        >
          {!isLogin && (
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter your full name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
              className="!mb-4"
            >
              <Input
                prefix={<RxPerson size={16} className="text-gray-400" />}
                placeholder="Enter your full name"
                className={inputClasses}
                autoComplete="name"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
            className="!mb-4"
          >
            <Input
              prefix={<RxEnvelopeClosed size={16} className="text-gray-400" />}
              placeholder="Enter your email"
              className={inputClasses}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
            className="!mb-4"
          >
            <Input.Password
              prefix={<RxLockClosed size={16} className="text-gray-400" />}
              placeholder="Enter your password"
              className={inputClasses}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value !== getFieldValue("password")) {
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              className="!mb-4"
            >
              <Input.Password
                prefix={<RxLockClosed size={16} className="text-gray-400" />}
                placeholder="Confirm your password"
                className={inputClasses}
                autoComplete="new-password"
              />
            </Form.Item>
          )}

          {error && (
            <Alert
              message={error.message}
              type="error"
              showIcon
              className="!mb-4 !rounded-xl"
            />
          )}

          <Form.Item className="!mt-5 !mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
              className="!h-11 sm:!h-12 !text-sm sm:!text-[16px] !font-semibold !rounded-xl !bg-gradient-to-br !from-primary !to-primary-dark !border-none hover:!from-primary-dark hover:!to-[#4366c4] hover:!-translate-y-px hover:!shadow-[0_4px_16px_rgba(99,142,255,0.3)] active:!translate-y-0 transition-all duration-200"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Link
              onClick={toggleAuthMode}
              className="text-primary font-semibold ml-1 hover:text-primary-dark transition-colors duration-200"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center my-5 sm:my-6 md:my-7 text-gray-400 text-xs sm:text-[13px]">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 sm:px-4 bg-white">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Login */}
        <div className="flex gap-3">
          <Button
            type="default"
            className="flex-1 !h-11 sm:!h-12 !rounded-xl !border-gray-200 !text-sm sm:!text-[15px] !font-medium !text-gray-600 hover:!border-primary hover:!text-primary hover:!bg-primary/5 transition-all duration-200"
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Google
          </Button>
          <Button
            type="default"
            className="flex-1 !h-11 sm:!h-12 !rounded-xl !border-gray-200 !text-sm sm:!text-[15px] !font-medium !text-gray-600 hover:!border-primary hover:!text-primary hover:!bg-primary/5 transition-all duration-200"
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#24292E" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            }
          >
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
