//
import WPPost, { WPPostOption } from "./WPPost";
import MDChecker, { WPCheckResult } from "./MDChecker";

export const wppost = async (
  docPath: string,
  apiUrl: string,
  authUser: string,
  authPassword: string,
  option?: WPPostOption
): Promise<string> => {
  const wpost = new WPPost(docPath);
  //
  const postId = await wpost.post(apiUrl, authUser, authPassword);
  return postId;
};

export const getLinks = (docPath: string): WPCheckResult[] => {
  const wppost = new MDChecker(docPath);
  return wppost.getLinks();
};

export const getFileReferences = (docPath: string): WPCheckResult[] => {
  const wppost = new MDChecker(docPath);
  return wppost.getFileReferences();
};

//
export * as WPPost from "./WPPost";
export * as MDChecker from "./MDChecker";
