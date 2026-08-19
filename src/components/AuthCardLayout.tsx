import React from "react";
import Card from "./ui/Card";

interface AuthCardLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Shared centered-card wrapper for LoginPage/RegisterPage, which previously
 * duplicated this exact markup (container/col/Card/title) around their own
 * form content.
 */
const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ title, children }) => {
  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="col-12 col-md-6 col-lg-4 p-2 rounded">
        <Card shadow={false} padding="sm" className="text-center rounded">
          <h1 className="mb-4">{title}</h1>
          {children}
        </Card>
      </div>
    </div>
  );
};

export default AuthCardLayout;
