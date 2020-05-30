const request = require("request");
const cheerio = require("cheerio");

const baseUrl = "https://www.freeroms.com";

module.exports = function () {
  function getAllPlatforms() {
    return new Promise((resolve, reject) => {
      request.get(baseUrl, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          const $ = cheerio.load(body);
          const pathMenu = "ul.desktop-menu";
          const plaforms = $(pathMenu)
            .children()
            .map((i, elem) => {
              const name = $(elem).children("a").text();
              const plaform = $(elem)
                .children("a")
                .attr("href")
                .replace("/", "")
                .replace(".htm", "");

              return { name, plaform, image: "" };
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
      const path =
        platform && platform.includes("roms") ? platform : `${platform}_roms`;
      const url = `${baseUrl}/${path}_${letter.toUpperCase()}.htm`;
      request.get(url, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          const $ = cheerio.load(body);

          const paginate = $(".pagination > .page > a")
            .map((i, elem) => $(elem).text())
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

        reject({});
      });
    });
  }

  function getInfoRoms(platform, path) {
    return new Promise((resolve, reject) => {
      const url = `${baseUrl}/roms/${platform}/${path}.htm`;
      request.get(url, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          const $ = cheerio.load(body);

          const name = $(".rom-th-wrap > .rom-tr.title").text();

          const download = $(".system-rom-drct > .drct-link > script")
            .html()
            .match(/\bhttps?:\/\/\S+/gi)
            .map((m) => {
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
        reject({});
      });
    });
  }

  return {
    getAllPlatforms,
    getRomsByPlatform,
    getInfoRoms,
  };
};
