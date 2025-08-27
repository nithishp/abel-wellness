import { ID } from "node-appwrite";
import {databases} from "../appwrite.config";
import { parseStringify } from "../utils";

const DATABASE_ID = process.env.DATABASE_ID;
const APPOINTMENTS_ID = process.env.APPOINTMENTS_ID;
export const createAppointment = async (data) => {
    try {
        const newAppointment = await databases.createDocument(
          "67221cfb0019faf6d97d",
          "67221d14002592954b5d",
          ID.unique(),
          data
        );
        return parseStringify(newAppointment);
    } catch (error) {
        console.log(error);
    }
    }
