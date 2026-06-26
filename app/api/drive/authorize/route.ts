import { NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/googleDrive";
import { store } from "@/lib/store";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/drive/authorize/route.ts");

export async function GET(request: Request) {
  const traceId = request.headers.get("x-trace-id") || "no-trace-id";

  return traceStorage.run(traceId, async () => {
    logRequest(request);

    try {
      logger.log("Authentication", "Checking teacher authentication");
      const teacherId = await requireTeacherId(request);

      logger.log("Database", "Fetching teacher data", { teacherId });
      const teacher = await store.getTeacher(teacherId);

      if (!teacher) {
        logger.log("Error", "Teacher not found", { teacherId });
        const response = NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 }
        );
        logResponse(response, { error: "Teacher not found" });
        return response;
      }

      logger.log("Processing", "Generating OAuth authorization URL", {
        teacherEmail: teacher.email,
      });
      const authUrl = getAuthorizationUrl(teacher.email);

      logger.log("Success", "Authorization URL generated");
      const response = NextResponse.json({ authUrl });
      logResponse(response, { authUrl });
      return response;
    } catch (error) {
      logger.log("Error", "Failed to generate authorization URL", { error });
      const response = NextResponse.json(
        { error: "Failed to generate authorization URL" },
        { status: 500 }
      );
      logResponse(response, { error: "Failed to generate authorization URL" });
      return response;
    }
  });
}
