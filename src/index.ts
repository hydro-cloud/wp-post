//
import WPPost, { MarkdownOption ,WPCheckResult} from "./lib/WPPost";

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

export const  getLinksAsync = async(docPath: string): Promise<WPCheckResult[]> => {
  const wppost = new WPPost(docPath);
  return await wppost.getLinksAsync();
};

export const getFileReferencesAsync = async(docPath: string): Promise<WPCheckResult[]> => {
  const wppost = new WPPost(docPath);
  return await wppost.getFileReferencesAsync();
};

//
export default WPPost;
