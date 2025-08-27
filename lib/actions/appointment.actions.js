import { ID } from "node-appwrite";
import { databases, DATABASE_ID, APPOINTMENTS_ID } from "../appwrite.config";
import { parseStringify } from "../utils";

export const createAppointment = async (data) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID,
      APPOINTMENTS_ID,
      ID.unique(),
      data
    );
    return parseStringify(newAppointment);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to create appointment");
  }
};
