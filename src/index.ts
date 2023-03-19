//
import WPPost, { MarkdownOption ,WPCheckResult} from "./WPPost";

export const wppostAync = async (
  docPath: string,
  apiUrl: string,
  authUser: string,
  authPassword: string,
  options?: MarkdownOption
): Promise<string> => {
  const wpost = new WPPost(docPath,options);
 
  //
  const postId = await wpost.postAsync(apiUrl, authUser, authPassword);
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
export default WPPost;
