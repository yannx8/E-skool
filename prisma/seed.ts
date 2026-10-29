// Demo school: `npm run demo` on an empty database.
// Synthetic data (names, phones, amounts): replace it with the real school's data.
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { bootstrapSchool, STANDARD_CLASSES } from "../src/lib/bootstrap";
import { applyCredit, recordPayment, syncCharges } from "../src/lib/billing";
import { accountPosition } from "../src/lib/queries";
import { day, today } from "../src/lib/format";
import type { Method } from "../src/generated/prisma/client";

let s = 20261027;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const at = (d: string, h: number, m = Math.floor(rnd() * 60)) => new Date(`${d}T${String(h - 1).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`); // Douala = UTC+1

const SURNAMES = ["NKENG", "FOTSO", "MBARGA", "ESSOMBA", "TCHOUMI", "NJOYA", "EKWALLA", "DOUALLA", "MANGA", "NGUEMA", "KAMGA", "TAMBA", "ABENA", "BELLA", "ATANGANA", "MOUKOKO", "NANA", "WAMBA", "YOMBI", "KOUOH", "EPOH", "NDJOCK", "BIYONG", "MOTTO", "DIKONGUE", "TCHAMBA", "FOUDA", "OWONA", "KENFACK", "SIMO", "NOAH", "ELA", "NDOUMBE", "PRISO", "MOUNDI", "EYOUM", "NKOTTO", "TJEGA", "MBAPPE", "SONE", "MEKA", "NGO BIYIK", "ONANA", "MVONDO", "TABI", "LOBE", "NGALLE", "KOTTO", "ESSAMA", "NYAMSI"];
const GIRLS = ["Grace", "Brenda", "Lysiane", "Murielle", "Divine", "Prisca", "Ornella", "Christelle", "Joyce", "Merveille", "Larissa", "Sandrine", "Esther", "Blessing", "Vanessa", "Audrey", "Kelly", "Ange", "Precious", "Marie-Claire"];
const BOYS = ["Junior", "Yann", "Brice", "Arthur", "Samuel", "Franck", "Ryan", "Stéphane", "Ivan", "Kevin", "Emmanuel", "Loïc", "Daniel", "Hervé", "Joël", "Patrick", "Christian", "Wilfried", "Boris", "Enzo"];
const AREAS = ["Bonamoussadi", "Makepe", "Kotto", "Logpom", "Denver", "Bonapriso", "Akwa", "Deïdo", "Bépanda", "Ndogbong", "PK14", "Cité des Palmiers"];
const PARENTS_F = ["Marie", "Jeanne", "Hortense", "Cécile", "Pauline", "Rose", "Odile", "Berthe", "Nadège", "Solange"];
const PARENTS_M = ["Alain", "Paul", "Jean-Pierre", "Martin", "Roger", "Didier", "Thierry", "Serge", "Bernard", "Eric"];

async function main() {
  if (await db.school.findUnique({ where: { id: 1 } })) throw new Error("The database already has a school. Demo data goes into an empty database only.");
  const pw = await hashPassword("eskool2026");
  const { admin, year } = await bootstrapSchool(db, {
    school: "Les Bambins Bilingual School",
    address: "Rue des Écoles, Bonamoussadi, Douala",
    phone: "677459012",
    adminName: "Mireille Ngo",
    username: "admin",
    passwordHash: pw,
    yearName: "2026-2027",
    startsOn: "2026-09-01",
    endsOn: "2027-06-30",
    classes: STANDARD_CLASSES,
  });
  await db.school.update({ where: { id: 1 }, data: { motto: "Discipline · Work · Success", receiptNote: "Fees paid are not refundable. Keep this receipt." } });
  const cashier = await db.user.create({ data: { name: "Mado Ekwalla", username: "cashier", passwordHash: pw, role: "CASHIER" } });
  await db.user.create({ data: { name: "Paul Tchoumi", username: "owner", passwordHash: pw, role: "OWNER" } });

  // Fee table: the grid a Douala private primary school posts at its gate.
  const classes = await db.class.findMany({ orderBy: { level: "asc" } });
  const items = await db.feeItem.findMany({ where: { yearId: year.id }, orderBy: { position: "asc" } });
  const grid: Record<string, number[]> = {
    Registration: [15000, 15000, 20000, 20000, 20000, 20000, 25000, 25000],
    "Tuition, 1st installment": [45000, 45000, 55000, 55000, 55000, 55000, 60000, 65000],
    "Tuition, 2nd installment": [35000, 35000, 45000, 45000, 45000, 45000, 50000, 55000],
    "Tuition, 3rd installment": [30000, 30000, 40000, 40000, 40000, 40000, 45000, 50000],
  };
  for (const i of items) await db.feeAmount.createMany({ data: classes.map((c, k) => ({ feeItemId: i.id, classId: c.id, amount: grid[i.name][k] })) });
  const transport = await db.feeItem.create({ data: { yearId: year.id, name: "School bus, 1st term", dueOn: day("2026-09-15"), optional: true, position: 5 } });
  const canteen = await db.feeItem.create({ data: { yearId: year.id, name: "Canteen, 1st term", dueOn: day("2026-09-15"), optional: true, position: 6 } });
  await db.feeAmount.createMany({ data: classes.flatMap((c) => [{ feeItemId: transport.id, classId: c.id, amount: 30000 }, { feeItemId: canteen.id, classId: c.id, amount: 25000 }]) });

  // Families and pupils.
  const families: { id: number; pupils: number; profile: number }[] = [];
  let code = 0;
  const used = new Set<string>();
  for (let f = 0; f < 96; f++) {
    let name = pick(SURNAMES);
    while (used.has(name) && used.size < SURNAMES.length) name = pick(SURNAMES);
    used.add(name);
    if (used.size >= SURNAMES.length) used.clear();
    const mother = rnd() < 0.6;
    const fam = await db.family.create({
      data: {
        name,
        guardian: mother ? `Mrs ${pick(PARENTS_F)} ${name[0]}${name.slice(1).toLowerCase()}` : `Mr ${pick(PARENTS_M)} ${name[0]}${name.slice(1).toLowerCase()}`,
        phone: `6${pick(["5", "7", "8", "9"])}${String(Math.floor(rnd() * 1e7)).padStart(7, "0")}`,
        phone2: rnd() < 0.3 ? `6${pick(["7", "9"])}${String(Math.floor(rnd() * 1e7)).padStart(7, "0")}` : null,
        address: pick(AREAS),
      },
    });
    const n = rnd() < 0.5 ? 1 : rnd() < 0.75 ? 2 : 3;
    let lvl = Math.floor(rnd() * 8);
    for (let k = 0; k < n; k++) {
      const girl = rnd() < 0.5;
      const birthYear = 2024 - lvl - 2;
      const pupil = await db.pupil.create({
        data: { familyId: fam.id, code: `26-${String(++code).padStart(4, "0")}`, lastName: name, firstNames: `${pick(girl ? GIRLS : BOYS)}${rnd() < 0.4 ? ` ${pick(girl ? GIRLS : BOYS)}` : ""}`, sex: girl ? "F" : "M", birthDate: day(`${birthYear}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 28)).padStart(2, "0")}`) },
      });
      const e = await db.enrollment.create({ data: { pupilId: pupil.id, yearId: year.id, classId: classes[lvl].id, joinedOn: day("2026-09-01") } });
      await db.$transaction((tx) => syncCharges(tx, e.id));
      if (rnd() < 0.18) await db.charge.create({ data: { enrollmentId: e.id, feeItemId: transport.id, label: transport.name, amount: 30000, dueOn: transport.dueOn } });
      if (rnd() < 0.15) await db.charge.create({ data: { enrollmentId: e.id, feeItemId: canteen.id, label: canteen.name, amount: 25000, dueOn: canteen.dueOn } });
      if (rnd() < 0.3) await db.charge.create({ data: { enrollmentId: e.id, label: "Uniform (2 sets)", amount: 12000, dueOn: day("2026-09-01") } });
      if (k > 0) await db.charge.updateMany({ where: { enrollmentId: e.id, label: { startsWith: "Tuition" } }, data: { discount: 5000, discountReason: "Sibling discount" } });
      lvl = Math.max(0, lvl - 1 - Math.floor(rnd() * 2));
    }
    // 0 = pays everything early, 1 = on time, 2 = partial, 3 = late payer
    families.push({ id: fam.id, pupils: n, profile: rnd() < 0.2 ? 0 : rnd() < 0.55 ? 1 : rnd() < 0.6 ? 2 : 3 });
  }

  // Staff.
  const staffNames = [["Mme Hortense Ebelle", "Head teacher", 180000], ["M. Joël Kamdem", "Teacher, Class 6", 95000], ["Mme Odile Ngah", "Teacher, Class 5", 90000], ["Mlle Divine Akwa", "Teacher, Class 4", 85000], ["M. Serge Mbia", "Teacher, Class 3", 85000], ["Mme Rose Tanga", "Teacher, Class 2", 80000], ["Mlle Larissa Fon", "Teacher, Class 1", 80000], ["Mme Berthe Ondoa", "Nursery 2", 75000], ["Mlle Prisca Ewane", "Nursery 1", 75000], ["M. Didier Nkolo", "Driver", 60000], ["Mme Solange Ebode", "Cook", 50000], ["M. Roger Abanda", "Watchman", 45000]] as const;
  const staff = await Promise.all(staffNames.map(([name, position, salary]) => db.staff.create({ data: { name, position, salary, startedOn: day("2024-09-01") } })));

  const accounts = await db.account.findMany();
  const acc = (k: string) => accounts.find((a) => a.name === k)!;
  await db.account.update({ where: { id: acc("Bank").id }, data: { openingBalance: 2_400_000 } });
  await db.account.update({ where: { id: acc("Cash box").id }, data: { openingBalance: 50_000 } });
  const cats = await db.expenseCategory.findMany();
  const cat = (n: string) => cats.find((c) => c.name === n)!.id;
  const expense = async (d: string, c: string, description: string, amount: number, account: string, extra: object = {}) => {
    const e = await db.expense.create({ data: { spentOn: day(d), categoryId: cat(c), description, amount, accountId: acc(account).id, createdById: admin.id, createdAt: at(d, 11), ...extra } });
    return e;
  };

  // Day by day from 1 September to today: receipts, expenses, deposits, then the evening count.
  const end = today();
  const methodAcc: Record<Method, string> = { CASH: "Cash box", MTN_MOMO: "MTN MoMo", ORANGE_MONEY: "Orange Money", BANK: "Bank", OPENING: "Cash box" };
  for (let d = day("2026-09-01"); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    if (dow === 0) continue;
    const isRush = iso <= "2026-09-20";
    for (const f of families) {
      const chance = f.profile === 0 ? (iso <= "2026-09-08" ? 0.25 : 0.01) : f.profile === 1 ? (isRush ? 0.08 : 0.02) : f.profile === 2 ? (isRush ? 0.05 : 0.025) : iso >= "2026-10-10" ? 0.012 : 0.004;
      if (rnd() > chance) continue;
      const open = await db.charge.findMany({ where: { cancelledAt: null, enrollment: { pupil: { familyId: f.id } } }, include: { allocations: { include: { payment: true } } } });
      const owed = open.reduce((t, c) => t + c.amount - c.discount - c.allocations.reduce((u, a) => u + (a.payment.voidedAt ? 0 : a.amount), 0), 0);
      if (owed <= 0) continue;
      const amount = f.profile === 0 ? owed : Math.min(owed, Math.round((owed * (0.25 + rnd() * 0.4)) / 5000) * 5000 || 10000);
      const r = rnd();
      const method: Method = r < 0.58 ? "CASH" : r < 0.83 ? "MTN_MOMO" : r < 0.96 ? "ORANGE_MONEY" : "BANK";
      const p = await recordPayment(
        { familyId: f.id, amount, method, accountId: acc(methodAcc[method]).id, paidOn: iso, reference: method === "CASH" ? null : `${method === "BANK" ? "VIR" : "CI"}${Math.floor(rnd() * 1e9)}` },
        rnd() < 0.85 ? cashier.id : admin.id,
      );
      await db.payment.update({ where: { id: p.id }, data: { createdAt: at(iso, 8 + Math.floor(rnd() * 8)) } });
    }
    if (dow === 3) await expense(iso, "Teaching supplies", pick(["Chalk and markers", "Exercise books for stock", "Printer paper, 5 reams", "Cleaning products"]), 8000 + Math.floor(rnd() * 20) * 1000, "Cash box", { payee: "Librairie de Bonamoussadi" });
    if (dow === 5 && rnd() < 0.5) await expense(iso, "Transport", "Fuel for the school bus", 25000, "Cash box", { payee: "Total Makepe" });
    if (iso === "2026-09-10" || iso === "2026-10-09") await expense(iso, "Electricity & water", "ENEO electricity bill", 46500, "Orange Money", { reference: `ENEO-${iso.slice(5, 7)}` });
    if (iso === "2026-10-05") await expense(iso, "Maintenance & repairs", "Repair of two classroom doors", 35000, "Cash box", { payee: "Menuiserie Kotto" });
    if (iso === "2026-09-30")
      for (const st of staff) await expense(iso, "Salaries", `Salary 2026-09 · ${st.name}`, st.salary, "Bank", { staffId: st.id, payMonth: "2026-09", payee: st.name });
    if (iso === "2026-10-15")
      for (const st of staff.slice(3, 7)) await expense(iso, "Salary advances", `Advance 2026-10 · ${st.name}`, 20000, "Cash box", { staffId: st.id, payMonth: "2026-10", payee: st.name });

    // Friday: the bursar banks the cash, leaving a float.
    const box = acc("Cash box");
    if (dow === 5) {
      const { balance } = await accountPosition(box.id, box.openingBalance);
      if (balance > 150_000) await db.transfer.create({ data: { movedOn: day(iso), fromAccountId: box.id, toAccountId: acc("Bank").id, amount: Math.floor((balance - 50_000) / 10_000) * 10_000, reference: `Slip ${Math.floor(rnd() * 90000) + 10000}`, createdById: admin.id, createdAt: at(iso, 15) } });
    }
    // Evening count, blind; once the cashier came up short.
    if (iso < end) {
      const { balance } = await accountPosition(box.id, box.openingBalance);
      const short = iso === "2026-10-21" ? 5000 : 0;
      await db.cashCount.create({ data: { accountId: box.id, counted: balance - short, expected: balance, note: short ? "Change given twice to a parent, will follow up" : null, createdById: cashier.id, createdAt: at(iso, 17, 30) } });
    }
  }

  // One mistake voided, a few promises and reminders.
  const wrong = await db.payment.findFirst({ where: { method: "CASH", paidOn: day("2026-10-14") }, orderBy: { id: "asc" } });
  if (wrong) {
    await db.payment.update({ where: { id: wrong.id }, data: { voidedAt: at("2026-10-14", 16), voidedById: admin.id, voidReason: "Typed 50,000 instead of 5,000; new receipt issued" } });
    await db.auditLog.create({ data: { userId: admin.id, action: "payment.void", entity: "Payment", entityId: wrong.id, at: at("2026-10-14", 16), detail: { number: wrong.number, amount: wrong.amount, reason: "Typed 50,000 instead of 5,000; new receipt issued" } } });
    await db.$transaction((tx) => applyCredit(tx, wrong.familyId));
  }
  const late = families.filter((f) => f.profile === 3);
  const promises: [number, number, string, string][] = [
    [late[0].id, 60000, "2026-11-05", "Father paid when salary arrives"],
    [late[1].id, 45000, "2026-10-31", "Agreed with the director"],
    [late[2].id, 50000, "2026-10-20", "Promised after the holidays"],
  ];
  for (const [familyId, amount, dueOn, note] of promises)
    await db.paymentPromise.create({ data: { familyId, amount, dueOn: day(dueOn), note, createdById: admin.id, createdAt: at("2026-10-12", 10) } });
  for (const f of late.slice(3, 15)) await db.reminder.create({ data: { familyId: f.id, channel: "WHATSAPP", amountDue: 50000, createdById: cashier.id, createdAt: at("2026-10-19", 9) } });

  const n = await db.pupil.count();
  console.log(`Demo school ready: ${families.length} families, ${n} pupils. Sign in as admin / cashier / owner, password eskool2026.`);
}

main().finally(() => db.$disconnect());
