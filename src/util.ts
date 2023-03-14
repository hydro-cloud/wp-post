export const stringFormat = function (
  template: string,
  values?: { [key: string]: string | number | null | undefined }
): string {
  return !values
    ? template
    : new Function(...Object.keys(values), `return \`${template}\`;`)(
        ...Object.values(values).map((value) => value ?? "")
      );
};

export const escapeHTML = (str: string) =>
  typeof str !== "string"
    ? str
    : str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/, "&quot;")
        .replace(/'/, "&#039;");

export const markdownToLiner = (text: string) =>
  text.replace(/\r\n/g, "\n").replace(/\n/g, "\\n");

export const htmlToLiner = (text: string) =>
  text.replace(/"/g, '\\"').replace(/\r\n/g, "\n").replace(/\n/g, "\\n");
