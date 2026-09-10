// In-memory seed data. Fresh copy per student store (see isolation.js).

function makeSeed() {
  const submissions = [
    {
      id: 1,
      candidateId: 101,
      current: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
      permanent: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
      sameAsPermanent: true,
      matchPercent: 100,
      createdAt: "2026-07-01T09:00:00.000Z",
    },
    {
      id: 2,
      candidateId: 102,
      current: { line1: "45 Park Street", city: "Kolkata", state: "West Bengal", pincode: "700016" },
      permanent: { line1: "9 Anna Salai", city: "Chennai", state: "Tamil Nadu", pincode: "600002" },
      sameAsPermanent: false,
      matchPercent: 0,
      createdAt: "2026-07-02T10:15:00.000Z",
    },
  ];

  return { submissions, nextSubmissionId: submissions.length + 1 };
}

module.exports = { makeSeed };
