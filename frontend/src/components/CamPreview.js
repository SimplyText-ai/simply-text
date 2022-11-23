import "./styles/CamPreview.css";
import Webcam from "react-webcam";
import React, {useEffect, useRef} from "react";
import {addPage} from "../utils/firebase"
import { httpsCallable } from "firebase/functions";
import { functions } from "../utils/firebase";
const FACING_MODE_USER = { exact: "user" };
const FACING_MODE_ENVIRONMENT = { exact: "environment" };

const cloudVisionCall = httpsCallable(functions, 'callCloudVision');

const videoConstraints = {
  facingMode: FACING_MODE_ENVIRONMENT,
};

const callGoogleVisionApi = async(base64) => {
  let googleVisionRes = await cloudVisionCall({image: base64});
  console.log(googleVisionRes);
  const result = googleVisionRes;
  return result.data.response.responses[0].fullTextAnnotation.text;
}

const CamPreview = () => {
  const camPreview = useRef(null);
  const [url, setUrl] = React.useState(null);
  const [base64, setBase64] = React.useState(null);
  const [extractedText, setExtractedText] = React.useState("No Extracted Text");
  const [facingMode, setFacingMode] = React.useState(FACING_MODE_ENVIRONMENT);

  const capturePhoto = React.useCallback(async () => {
    const imageSrc = camPreview.current;
    setUrl(imageSrc.getScreenshot());
    setBase64(imageSrc.getScreenshot().split(',')[1]);
  }, [camPreview]);

  useEffect(() => {
    async function fetchResult() {
      if(base64) {
        const result = await callGoogleVisionApi(base64);
        setExtractedText(result);
        await addPage("user", result);
      }
    }

    fetchResult();
  },[base64]);

  const flip = React.useCallback(() => {

    setFacingMode(
      prevState =>
      prevState === FACING_MODE_USER
      ? FACING_MODE_ENVIRONMENT
      : FACING_MODE_USER
    );

  }, []);

  const onUserMedia = (e) => {
    console.log(e);
};

return (
    <>
      <Webcam
        ref={camPreview}
        screenshotFormat="image/png"
        width={360}
        videoConstraints={{...videoConstraints, facingMode}}
        onUserMedia={onUserMedia}
        mirrored={false}
        screenshotQuality={0.7}
      />
      <button onClick={capturePhoto}>Capture</button>
      <button onClick={() => setUrl(null)}>Refresh</button>
      <button onClick={flip}>Flip</button>
      {url && (
        <div>
          <img src={url} alt="Screenshot" />
        </div>
      )}
      <p>{extractedText}</p>
    </>
  );
};

export default CamPreview;