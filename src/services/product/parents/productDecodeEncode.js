const { AES } = require("crypto-js");
const CryptoJS = require("crypto-js");
module.exports = class productDecodeEncoder {
  generateSecretKey = () => {
    const keyLength = 32; // 32 bytes = 256 bits (AES-256)
    const buffer = new Uint8Array(keyLength);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  };
  encryptData = (data) => {
    try {
      const encryptedData = AES.encrypt(
        JSON.stringify(data),
        "productSecret"
      ).toString();
      return {
        status: "success",
        message: "successfully encrypted",
        data: encryptedData,
      };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  };

  decryptData = (encryptedData) => {
    try {
      const decryptedData = AES.decrypt(
        encryptedData,
        "productSecret"
      ).toString(CryptoJS.enc.Utf8);
      //   return JSON.parse(decryptedData);
      return {
        status: "success",
        message: "successfully decrypted",
        data: JSON.parse(decryptedData),
      };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  };
};
