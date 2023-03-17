//
import WPPost, { WPPostOption ,WPCheckResult} from "./WPPost";

export const wppost = async (
  docPath: string,
  apiUrl: string,
  authUser: string,
  authPassword: string,
  options?: WPPostOption
): Promise<string> => {
  const wpost = new WPPost(docPath,options);
 
  //
  const postId = await wpost.post(apiUrl, authUser, authPassword);
  return postId;
};

export const getLinks = (docPath: string): WPCheckResult[] => {
  const wppost = new WPPost(docPath);
  return wppost.getLinks();
};

export const getFileReferences = (docPath: string): WPCheckResult[] => {
  const wppost = new WPPost(docPath);
  return wppost.getFileReferences();
};

//
export * as WPPost from "./WPPost";
