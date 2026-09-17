export const logger = {
  info(message) {
    console.log(new Date().toISOString(), message);
  },

  error(message, error) {
    console.error(
      new Date().toISOString(),
      message,
      error?.name || "Error",
      error?.code || "",
    );
  },
};