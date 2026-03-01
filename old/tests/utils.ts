import { Express } from "express";
import request from "supertest";

/**
 * Helper function to register a new user
 */
export const registerUser = async (app: Express, userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}) => {
    const response = await request(app)
        .post("/auth/register")
        .send(userData);
    return response;
};

/**
 * Helper function to login and get tokens
 */
export const loginUser = async (app: Express, credentials: {
    email: string;
    password: string;
}) => {
    const response = await request(app)
        .post("/auth/login")
        .send(credentials);
    return response;
};

/**
 * Helper function to create a user and login, returning access token
 */
export const createUserAndLogin = async (app: Express, userData = {
    username: "testuser",
    email: "test@example.com",
    password: "password123"
}) => {
    await registerUser(app, userData);
    const loginResponse = await loginUser(app, {
        email: userData.email,
        password: userData.password
    });
    return loginResponse.body.accessToken;
};

/**
 * Sample user data for testing
 */
export const sampleUser = {
    username: "johndoe",
    email: "john@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe"
};

export const sampleUser2 = {
    username: "janedoe",
    email: "jane@example.com",
    password: "password456",
    firstName: "Jane",
    lastName: "Doe"
};
