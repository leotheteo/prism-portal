import { User, Submission, InsertUser, InsertSubmission } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isTeamMember?: boolean }): Promise<User>;
  createSubmission(submission: InsertSubmission & { createdAt: string }): Promise<Submission>;
  getSubmissions(): Promise<Submission[]>;
  getSubmission(id: number): Promise<Submission | undefined>;
  updateSubmissionStatus(id: number, status: string): Promise<Submission | undefined>;
  deleteSubmissionFile(id: number, type: string, index?: number): Promise<Submission | undefined>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private submissions: Map<number, Submission>;
  public sessionStore: session.Store;
  private currentUserId: number;
  private currentSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.submissions = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create team member account
    this.initializeTeamMember();
  }

  private async initializeTeamMember() {
    await this.createUser({
      username: "Leo",
      password: await hashPassword("Ms425729"),
      isTeamMember: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isTeamMember?: boolean }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isTeamMember: insertUser.isTeamMember ?? false
    };
    this.users.set(id, user);
    return user;
  }

  async createSubmission(submission: InsertSubmission & { createdAt: string }): Promise<Submission> {
    const id = this.currentSubmissionId++;
    const newSubmission: Submission = {
      ...submission,
      id,
      status: "pending",
    };
    this.submissions.set(id, newSubmission);
    return newSubmission;
  }

  async getSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values());
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async updateSubmissionStatus(id: number, status: string): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission = { ...submission, status };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async deleteSubmissionFile(id: number, type: string, index?: number): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    let updatedSubmission: Submission;
    if (type === "artwork") {
      updatedSubmission = { ...submission, artworkUrl: null };
    } else if (type === "audio" && typeof index === "number") {
      const tracks = [...submission.tracks];
      if (index >= 0 && index < tracks.length) {
        tracks[index] = { ...tracks[index], audioFile: { url: "", title: "", trackNumber: index + 1 } };
        updatedSubmission = { ...submission, tracks };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }

    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
}

export const storage = new MemStorage();