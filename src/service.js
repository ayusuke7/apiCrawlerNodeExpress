const request = require("request");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const blacklist = require("./blacklist.json");
const baseUrl = "https://www.freeroms.com";

module.exports = function () {
  function listAllFiles() {
    return new Promise((resolve, reject) => {
      fs.readdir("public/images", function (err, files) {
        if (err) reject(err);
        resolve(files);
      });
    });
  }

  function getAllPlatforms() {
    return new Promise(async (resolve, reject) => {
      const files = await listAllFiles();

      request.get(baseUrl, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          const $ = cheerio.load(body);

          const plaforms = $("ul.desktop-menu")
            .children()
            .map((i, elem) => {
              const name = $(elem).children("a").text();

              const plaform = $(elem)
                .children("a")
                .attr("href")
                .replace("/", "")
                .replace(".htm", "");

              const image =
                files.find((file) =>
                  name.toLowerCase().includes(file.split(".")[0])
                ) || null;

              if (!blacklist.includes(plaform.toLowerCase())) {
                return { name, plaform, image };
              }
            })
            .get();

          resolve(plaforms);
        }

        reject([]);
      });
    });
  }

  function getRomsByPlatform(platform, letter = "A") {
    return new Promise((resolve, reject) => {
      const path = `${platform.split("_")[0]}_roms_${letter.toUpperCase()}.htm`;
      const url = `${baseUrl}/${path}`;

      request.get(url, (err, res, body) => {
        const $ = cheerio.load(body);

        if (!err && res.statusCode === 200) {
          const paginate = $(".pagination > .page")
            .first()
            .children("a")
            .map((i, elem) => {
              const text = $(elem).text();
              if (text !== "#") return text;
            })
            .get();

          const roms = $(".rom-tr.title > a")
            .map((i, elem) => {
              const name = $(elem).text();
              const link = $(elem)
                .attr("href")
                .replace(".htm", "")
                .split("/")
                .reverse();

              return { name, path: link[0], image: "" };
            })
            .get();

          resolve({ platform, letter, paginate, roms });
        }

        reject(null);
      });
    });
  }

  function getInfoRoms(platform, path) {
    return new Promise((resolve, reject) => {
      const sanitize = platform.split("_")[0];
      const url = `${baseUrl}/roms/${sanitize}/${path}.htm`;
      request.get(url, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          const $ = cheerio.load(body);

          const name = $(".rom-th-wrap > .rom-tr.title").text();

          let download;

          const script = $(".system-rom-drct > .drct-link > script").html();
          if (script !== null) {
            download = script.match(/\bhttps?:\/\/\S+/gi).map((m) => {
              let index;

              if (m.indexOf(".zip") > -1) {
                index = m.indexOf(".zip") + 4;
              } else if (m.indexOf(".7z") > -1) {
                index = m.indexOf(".7z") + 3;
              } else if (m.indexOf(".rar") > -1) {
                index = m.indexOf(".rar") + 4;
              } else {
                index = m.length;
              }

              return m.substring(0, index);
            });
          } else {
            download = $(".system-rom-tr-wrap > .rom-tr.title > a").attr(
              "href"
            );

            download = download ? [`${baseUrl}${download}`] : [];
          }

          const size = $(".system-rom-tr-wrap > .rom-tr.file-size")
            .first()
            .text()
            .replace("\n", "")
            .replace("RATE", "");

          const images = $(".game-img > center > img")
            .map((i, elem) => `${baseUrl}${$(elem).attr("src")}`)
            .get();

          resolve({ platform, name, path, size, images, download });
        }
        reject(null);
      });
    });
  }

  return {
    getAllPlatforms,
    getRomsByPlatform,
    getInfoRoms,
  };
};
