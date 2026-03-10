const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// Helper function to draw the custom frost snowflakes
function drawFrostSnowflake(ctx, x, y, size, fillStr, opacity) {
    ctx.strokeStyle = fillStr;
    ctx.fillStyle = `rgba(240, 245, 255, ${opacity})`;
    ctx.lineWidth = Math.max(1, size * 0.05);

    // Draw the 6 main branches
    for (let i = 0; i < 6; i++) {
        const angle = i * (Math.PI / 3);
        const endX = x + size * Math.sin(angle);
        const endY = y - size * Math.cos(angle);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw the sub-branches
        for (let k = 0; k < 3; k++) {
            const branchAngle = angle + (k - 1) * (Math.PI / 18);
            const sideEndX = x + size * 0.7 * Math.sin(branchAngle);
            const sideEndY = y - size * 0.7 * Math.cos(branchAngle);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(sideEndX, sideEndY);
            ctx.stroke();
        }

        // Draw branch tips
        const circleRadius = Math.max(1, size * 0.08);
        ctx.beginPath();
        ctx.arc(endX, endY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = fillStr;
        ctx.fill();
    }

    // Center circle
    const centerCircleRadius = Math.max(1, size * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, centerCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 245, 255, ${opacity})`;
    ctx.fill();
}

// Main generation function exported for use in your bot
async function generateMusicCard(trackInfo, requesterName) {
    const imgWidth = 780;
    const imgHeight = 260;
    const margin = 30;
    const artworkSize = 180;

    const canvas = createCanvas(imgWidth, imgHeight);
    const ctx = canvas.getContext('2d');

    let coverImg = null;

    // 1. Fetch Artwork & Draw Blurred Background
    // Note: Lavalink provides artwork URLs in track.info.artworkUrl (if available)
    // We fallback to a generic YouTube thumbnail constructor if needed.
    const thumbnail = trackInfo.artworkUrl || `https://img.youtube.com/vi/${trackInfo.identifier}/maxresdefault.jpg`;
    
    try {
        const response = await axios.get(thumbnail, { responseType: 'arraybuffer' });
        coverImg = await loadImage(Buffer.from(response.data));

        // Apply Gaussian Blur to the background
        ctx.filter = 'blur(15px)';
        ctx.drawImage(coverImg, -50, -50, imgWidth + 100, imgHeight + 100);
        ctx.filter = 'none'; // Reset filter

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, imgWidth, imgHeight);
    } catch (err) {
        // Fallback gradient if image fails to load
        ctx.fillStyle = '#141825';
        ctx.fillRect(0, 0, imgWidth, imgHeight);
    }

    const artworkX = margin;
    const artworkY = margin;
    const infoX = artworkX + artworkSize + 30;
    const infoContentWidth = imgWidth - infoX - margin;

    // 2. Draw Frosted Glass Panel
    const panelX = margin / 2;
    const panelY = margin / 2;
    const panelW = imgWidth - margin;
    const panelH = imgHeight - margin;

    ctx.fillStyle = 'rgba(20, 25, 40, 0.4)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 18);
    ctx.fill();

    // Snowflakes Generation
    for (let i = 0; i < 4; i++) {
        const x = panelX + 30 + (panelW - 60) * (0.1 + 0.1 * i);
        const y = panelY + 30 + (panelH - 60) * (0.2 + 0.1 * i);
        const size = 20 + 5 * i;
        const opacity = 0.1 + 0.05 * i;
        drawFrostSnowflake(ctx, x, y, size, `rgba(220, 230, 250, ${0.3 * opacity})`, opacity);
    }

    for (let i = 0; i < 8; i++) {
        const x = panelX + 30 + (panelW - 60) * (0.3 + 0.05 * i);
        const y = panelY + 30 + (panelH - 60) * (0.3 + 0.05 * (8 - i));
        const size = 10 + 2 * i;
        const opacity = 0.15 + 0.05 * i;
        drawFrostSnowflake(ctx, x, y, size, `rgba(220, 230, 250, ${0.3 * opacity})`, opacity);
    }

    // Frosted Panel Outline
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Draw The Album Artwork
    if (coverImg) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(artworkX, artworkY, artworkSize, artworkSize, 18);
        ctx.clip(); // Restrict drawing to the rounded rectangle
        
        // Center crop the image
        const aspect = coverImg.width / coverImg.height;
        let sWidth = coverImg.width, sHeight = coverImg.height;
        let sx = 0, sy = 0;
        
        if (aspect > 1) {
            sWidth = coverImg.height;
            sx = (coverImg.width - coverImg.height) / 2;
        } else {
            sHeight = coverImg.width;
            sy = (coverImg.height - coverImg.width) / 2;
        }
        
        ctx.drawImage(coverImg, sx, sy, sWidth, sHeight, artworkX, artworkY, artworkSize, artworkSize);
        ctx.restore();

        // Artwork Outline
        ctx.beginPath();
        ctx.roundRect(artworkX - 1, artworkY - 1, artworkSize + 2, artworkSize + 2, 19);
        ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        ctx.fillStyle = 'rgba(20, 25, 40, 0.4)';
        ctx.beginPath();
        ctx.roundRect(artworkX, artworkY, artworkSize, artworkSize, 18);
        ctx.fill();
    }

    // 4. Draw Typography & Information
    let currentY = artworkY + 30;
    
    // Source Text
    const extractor = trackInfo.sourceName || 'youtube';
    const sourceText = `Playing from ${extractor}`;
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Drop shadow
    ctx.fillText(sourceText, infoX + 1, currentY + 1);
    ctx.fillStyle = 'rgba(160, 176, 192, 1)';
    ctx.fillText(sourceText, infoX, currentY);

    currentY += 35;

    // Title Text
    let titleFull = trackInfo.title || 'Unknown Title';
    ctx.font = 'bold 38px "Times New Roman", Times, serif';
    
    // Shorten title if it overflows
    while (ctx.measureText(titleFull + "...").width > infoContentWidth && titleFull.length > 0) {
        titleFull = titleFull.slice(0, -1);
    }
    if (trackInfo.title && titleFull.length < trackInfo.title.length) titleFull += "...";

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Drop shadow
    ctx.fillText(titleFull, infoX + 2, currentY + 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(titleFull, infoX, currentY);

    currentY += 45;

    // Uploader / Artist
    let uploader = trackInfo.author || 'Unknown Artist';
    if (uploader.length > 30) uploader = uploader.substring(0, 30) + "...";
    ctx.font = '26px Arial';
    ctx.fillStyle = 'rgba(224, 232, 240, 1)';
    ctx.fillText(uploader, infoX, currentY);

    currentY += 45;

    // Duration Formatting (Lavalink gives time in milliseconds)
    const durationSec = trackInfo.length ? Math.floor(trackInfo.length / 1000) : 0;
    const isLive = trackInfo.isStream;
    let timeStr = "";
    
    if (isLive) {
        timeStr = "0:00 / LIVE";
    } else {
        const h = Math.floor(durationSec / 3600);
        const m = Math.floor((durationSec % 3600) / 60);
        const s = durationSec % 60;
        const padS = s.toString().padStart(2, '0');
        const padM = m.toString().padStart(2, '0');
        timeStr = h > 0 ? `0:00 / ${h}:${padM}:${padS}` : `0:00 / ${m}:${padS}`;
    }

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(160, 176, 192, 1)';
    ctx.fillText(timeStr, infoX, currentY);

    // Watermark
    const wmText = "Abrox Music";
    ctx.font = 'bold 16px Arial';
    const wmWidth = ctx.measureText(wmText).width;
    ctx.fillStyle = 'rgba(224, 232, 240, 0.78)';
    ctx.fillText(wmText, imgWidth - margin - wmWidth - 10, imgHeight - 35);

    // Convert Canvas to a Discord File Buffer
    return canvas.toBuffer('image/png');
}

module.exports = { generateMusicCard };
