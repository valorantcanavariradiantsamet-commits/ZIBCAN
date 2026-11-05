const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ana dizindeki statik dosyaları sun (index.html vb.)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// İndirme endpoint'i
app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Video URL adresi gereklidir.');
    }

    // Render klasörünün içindeki yt-dlp'yi gösteriyoruz
    const ytDlpPath = path.join(__dirname, 'yt-dlp');
    
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    // ffmpeg gerektirmeyen tek parça MP4 formatı (-f "b[ext=mp4]/b") ve playlist koruması (--no-playlist)
    const ytDlp = spawn(ytDlpPath, ['-f', 'b[ext=mp4]/b', '--no-playlist', '-o', '-', videoUrl]);

    ytDlp.stdout.pipe(res);

    ytDlp.stderr.on('data', (data) => {
        console.error(`yt-dlp hata: ${data}`);
    });

    ytDlp.on('close', (code) => {
        if (code !== 0) {
            console.log(`İşlem tamamlandı, kod: ${code}`);
        }
    });

    req.on('close', () => {
        ytDlp.kill();
    });
});

app.listen(PORT, () => {
    console.log(`ZIB Sunucusu ${PORT} portunda aktif!`);
});