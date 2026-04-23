declare module "@vercel/blob" {
  export type PutBlobResult = {
    url: string;
  };

  export function put(
    pathname: string,
    body: Blob | ArrayBuffer | ArrayBufferView | string,
    options?: {
      access?: "public";
      addRandomSuffix?: boolean;
      contentType?: string;
      token?: string;
    }
  ): Promise<PutBlobResult>;
}
