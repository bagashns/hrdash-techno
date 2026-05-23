export async function analyzeCVWithGemini(
  base64Data: string,
  mimeType: string,
  fileName: string,
  jobTitle: string,
  jobDescription: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const prompt = `
Anda adalah AI Recruiter Expert yang bertugas mengekstrak data dari CV pelamar dan menilainya berdasarkan Job Description yang diberikan.
Saya melampirkan sebuah file CV (Nama file: ${fileName}).

Kriteria Pekerjaan (Job Description):
- Posisi: ${jobTitle}
- Deskripsi & Kriteria: ${jobDescription}

TUGAS ANDA:
1. Ekstrak data dari CV tersebut.
2. Analisis kecocokan pengalaman, pendidikan, dan keahlian kandidat dengan Kriteria Pekerjaan.
3. Berikan skor kecocokan dari 0 hingga 100.
4. Berikan analisis singkat (2-3 kalimat) mengapa Anda memberikan skor tersebut.

KEMBALIKAN HASILNYA HANYA DALAM FORMAT JSON SEPERTI BERIKUT TANPA MARKDOWN ATAU TEKS TAMBAHAN:
{
  "nama": "Nama Lengkap",
  "email": "email@example.com",
  "telepon": "08123456789",
  "pendidikan": [
    {
      "jenjang": "S1 Teknik Informatika",
      "institusi": "Nama Universitas",
      "tahun_lulus": "2023"
    }
  ],
  "pengalaman": [
    {
      "posisi": "Software Engineer",
      "perusahaan": "Nama Perusahaan",
      "durasi": "2 tahun"
    }
  ],
  "skills": ["Python", "React", "SQL"],
  "score": 85,
  "analysis_notes": "Kandidat sangat cocok karena memiliki pengalaman 2 tahun di React dan Python sesuai kriteria. Namun, kurang pengalaman di AWS."
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", errorText);
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini tidak mengembalikan teks yang valid');
  }

  try {
    // Karena kita memakai responseMimeType: "application/json", hasilnya seharusnya JSON murni
    const parsedJSON = JSON.parse(rawText);
    return parsedJSON;
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText);
    throw new Error('Gagal mem-parsing output JSON dari Gemini');
  }
}
