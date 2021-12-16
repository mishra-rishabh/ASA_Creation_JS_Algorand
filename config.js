module.exports = {
  algodClientUrl: "https://testnet-algorand.api.purestake.io/ps2",
  algodClientPort: "",
  algodClientToken: "",
  pinataApiKey: "your pinata api key",
  pinataApiSecret: "your pinata api secret key",
  pinataFileUrl: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  pinataJSONUrl: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
  ipfsNode: "http://localhost:5002",

  arc3MetadataJSON: {
    name: "",
    description: "",
    image: "ipfs://",
    image_integrity: "sha256-",
    image_mimetype: "image/png",
    external_url: "",
    animation_url: "",
    animation_url_integrity: "sha256-",
    animation_url_mimetype: "",
    properties: {
      file_url: "",
      file_url_integrity: "",
      file_url_mimetype: "",
    }
  }
};
