import { users, submissions, faqs, type User, type InsertUser, type Submission, type FAQ } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createSubmission(submission: Submission): Promise<Submission>;
  getSubmissions(): Promise<Submission[]>;
  getSubmission(id: number): Promise<Submission | undefined>;
  updateSubmission(id: number, status: "approved" | "declined"): Promise<void>;
  deleteTrack(id: number, trackIndex: number): Promise<void>;
  deleteArtwork(id: number): Promise<void>;

  createFaq(faq: FAQ): Promise<FAQ>;
  getFaqs(): Promise<FAQ[]>;
  updateFaq(id: number, faq: Partial<FAQ>): Promise<void>;
  deleteFaq(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private submissions: Map<number, Submission>;
  private faqs: Map<number, FAQ>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentFaqId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.submissions = new Map();
    this.faqs = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentFaqId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { id, role: insertUser.role, username: insertUser.username, password: insertUser.password };
    this.users.set(id, user);
    return user;
  }

  async createSubmission(submission: Submission): Promise<Submission> {
    const id = this.currentSubmissionId++;
    const newSubmission = { ...submission, id };
    console.log("Creating submission:", newSubmission); // Add logging
    this.submissions.set(id, newSubmission);
    return newSubmission;
  }

  async getSubmissions(): Promise<Submission[]> {
    const subs = Array.from(this.submissions.values());
    console.log("Retrieved submissions:", subs); // Add logging
    return subs;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async updateSubmission(id: number, status: "approved" | "declined"): Promise<void> {
    const submission = this.submissions.get(id);
    if (submission) {
      submission.status = status;
      this.submissions.set(id, submission);
    }
  }

  async deleteTrack(id: number, trackIndex: number): Promise<void> {
    const submission = this.submissions.get(id);
    if (submission && submission.tracks && submission.tracks.length > trackIndex) {
      // Remove the track from the array
      submission.tracks.splice(trackIndex, 1);
      this.submissions.set(id, submission);
      console.log(`Deleted track ${trackIndex} from submission ${id}`);
    }
  }
  
  async deleteArtwork(id: number): Promise<void> {
    const submission = this.submissions.get(id);
    if (submission) {
      // Set the artwork to null
      submission.artwork = null;
      this.submissions.set(id, submission);
      console.log(`Deleted artwork from submission ${id}`);
    }
  }

  async createFaq(faq: FAQ): Promise<FAQ> {
    const id = this.currentFaqId++;
    const newFaq = { ...faq, id };
    this.faqs.set(id, newFaq);
    return newFaq;
  }

  async getFaqs(): Promise<FAQ[]> {
    return Array.from(this.faqs.values()).sort((a, b) => a.order - b.order);
  }

  async updateFaq(id: number, faq: Partial<FAQ>): Promise<void> {
    const existing = this.faqs.get(id);
    if (existing) {
      this.faqs.set(id, { ...existing, ...faq });
    }
  }

  async deleteFaq(id: number): Promise<void> {
    this.faqs.delete(id);
  }
}

export const storage = new MemStorage();