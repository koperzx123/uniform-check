const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("tmjson", "bin", "html"); // ให้ Metro ปล่อยเป็น asset
module.exports = config;
