import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const getTokenData = async (idToken) => {
  const googleUser = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  if(!googleUser){
    throw new Error("Invalid ID Token")
  }
  const payload = await googleUser.getPayload();

  const {email, picture, name,sub}=payload;
  return {email, picture, name,sub};
};
