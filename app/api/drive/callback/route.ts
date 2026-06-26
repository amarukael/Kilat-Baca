import { NextResponse } from "next/server";
import { exchangeCodeForTokens, storeDriveConfig } from "@/lib/googleDrive";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/drive/callback/route.ts");

export async function GET(request: Request) {
  const traceId = request.headers.get("x-trace-id") || "no-trace-id";

  return traceStorage.run(traceId, async () => {
    logRequest(request);

    try {
      const { searchParams } = new URL(request.url);
      const code = searchParams.get("code");
      const state = searchParams.get("state"); // teacher email
      const error = searchParams.get("error");

      logger.log("Validation", "Checking OAuth callback parameters", {
        hasCode: !!code,
        hasState: !!state,
        error,
      });

      if (error) {
        logger.log("Error", "OAuth authorization denied", { error });
        const response = NextResponse.redirect(
          new URL("/dashboard?drive_error=access_denied", request.url)
        );
        logResponse(response, { error: "access_denied" });
        return response;
      }

      if (!code || !state) {
        logger.log("Error", "Missing code or state parameter");
        const response = NextResponse.redirect(
          new URL("/dashboard?drive_error=invalid_callback", request.url)
        );
        logResponse(response, { error: "invalid_callback" });
        return response;
      }

      const teacherEmail = state;

      logger.log("Processing", "Exchanging authorization code for tokens", {
        teacherEmail,
      });
      const tokens = await exchangeCodeForTokens(code);

      if (!tokens.access_token) {
        logger.log("Error", "No access token received from Google");
        const response = NextResponse.redirect(
          new URL("/dashboard?drive_error=no_token", request.url)
        );
        logResponse(response, { error: "no_token" });
        return response;
      }

      logger.log("Database", "Storing drive configuration", { teacherEmail });
      await storeDriveConfig(
        teacherEmail,
        tokens.access_token,
        tokens.refresh_token,
        tokens as object
      );

      logger.log("Success", "Google Drive connected successfully", {
        teacherEmail,
      });
      const response = NextResponse.redirect(
        new URL("/dashboard?drive_success=true", request.url)
      );
      logResponse(response, { success: true });
      return response;
    } catch (error) {
      logger.log("Error", "Failed to process OAuth callback", { error });
      const response = NextResponse.redirect(
        new URL("/dashboard?drive_error=callback_failed", request.url)
      );
      logResponse(response, { error: "callback_failed" });
      return response;
    }
  });
}
