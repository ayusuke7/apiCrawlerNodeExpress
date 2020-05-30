const express = require("express");
const service = require("./service");

const app = express();
const crawler = service();

app.get("/", async function (req, res) {
  res.send(`
    <ul>
      <li><a href="/platforms">Plataforms</a></li>
    </ul>
  `);
});

app.get("/platforms", async function (req, res) {
  try {
    const platforms = await crawler.getAllPlatforms();
    res.send(platforms);
  } catch (error) {
    res.send(error);
  }
});

app.get("/platforms/:name?/:letter?", async function (req, res) {
  try {
    const { name, letter } = req.params;
    const roms = await crawler.getRomsByPlatform(name, letter);
    res.send(roms);
  } catch (error) {
    res.send(error);
  }
});

app.get("/roms/:platform/:name", async function (req, res) {
  try {
    const { platform, name } = req.params;
    const info = await crawler.getInfoRoms(platform, name);
    res.send(info);
  } catch (error) {
    res.send(error);
  }
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
