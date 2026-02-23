import mongoose from "mongoose";
import appPromise from "../src/app";
import { Express } from "express";
import request from "supertest";
import User from "../src/models/user";
import { createUserAndLogin, sampleUser, sampleUser2 } from "./utils";

describe("User API Tests", () => {
    let app: Express;

    // Wait for app to initialize (connects to DB)
    beforeAll(async () => {
        app = await appPromise;
    });

    // Clear database before each test
    beforeEach(async () => {
        await User.deleteMany({});
    });

    // Close database connection after all tests
    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe("POST /user - Create User", () => {
        it("should create a new user successfully", async () => {
            const response = await request(app)
                .post("/user")
                .send(sampleUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body.username).toBe(sampleUser.username);
            expect(response.body.email).toBe(sampleUser.email);
            expect(response.body).not.toHaveProperty("password");
        });

        it("should fail without required fields", async () => {
            const response = await request(app)
                .post("/user")
                .send({ username: "testuser" });

            expect(response.status).toBe(400);
        });
    });

    describe("GET /user - Get All Users", () => {
        it("should get all users with valid token", async () => {
            const token = await createUserAndLogin(app, sampleUser);

            const response = await request(app)
                .get("/user")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it("should fail without authentication", async () => {
            const response = await request(app)
                .get("/user");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /user/:userId - Get User By ID", () => {
        it("should get user by ID with valid token", async () => {
            const token = await createUserAndLogin(app, sampleUser);
            const user = await User.findOne({ email: sampleUser.email });

            const response = await request(app)
                .get(`/user/${user?._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(sampleUser.email);
        });

        it("should fail without authentication", async () => {
            const response = await request(app)
                .get("/user/123456789012345678901234");

            expect(response.status).toBe(401);
        });
    });

    describe("PUT /user/:userId - Update User", () => {
        it("should update user successfully", async () => {
            const token = await createUserAndLogin(app, sampleUser);
            const user = await User.findOne({ email: sampleUser.email });

            const response = await request(app)
                .put(`/user/${user?._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ firstName: "Updated", lastName: "Name" });

            expect(response.status).toBe(200);
            expect(response.body.firstName).toBe("Updated");
        });

        it("should fail without authentication", async () => {
            const response = await request(app)
                .put("/user/123456789012345678901234")
                .send({ firstName: "Updated" });

            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /user/:userId - Delete User", () => {
        it("should delete user successfully", async () => {
            const token = await createUserAndLogin(app, sampleUser);
            const user = await User.findOne({ email: sampleUser.email });

            const response = await request(app)
                .delete(`/user/${user?._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);

            // Verify user is deleted
            const deletedUser = await User.findById(user?._id);
            expect(deletedUser).toBeNull();
        });

        it("should fail without authentication", async () => {
            const response = await request(app)
                .delete("/user/123456789012345678901234");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /user/:userId/posts - Get User Posts", () => {
        it("should get user posts with valid token", async () => {
            const token = await createUserAndLogin(app, sampleUser);
            const user = await User.findOne({ email: sampleUser.email });

            const response = await request(app)
                .get(`/user/${user?._id}/posts`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe("GET /user/:userId/comments - Get User Comments", () => {
        it("should get user comments with valid token", async () => {
            const token = await createUserAndLogin(app, sampleUser);
            const user = await User.findOne({ email: sampleUser.email });

            const response = await request(app)
                .get(`/user/${user?._id}/comments`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
