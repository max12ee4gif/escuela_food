//#region node_modules/.nitro/vite/services/ssr/assets/time-D7K8VdEQ.js
var DISH_PRESETS = [
	{
		id: "pastor",
		name: "Tacos al pastor",
		photo: "/dishes/pastor.jpg",
		notes: "Cebolla, cilantro y piña. Trae efectivo."
	},
	{
		id: "spaghetti",
		name: "Espagueti boloñesa",
		photo: "/dishes/spaghetti.jpg",
		notes: "Queso parmesano. Trae efectivo."
	},
	{
		id: "sandwich",
		name: "Sandwich de pollo",
		photo: "/dishes/sandwich.jpg",
		notes: "Crujiente, con pickles. Trae efectivo."
	},
	{
		id: "quesadillas",
		name: "Quesadillas de queso",
		photo: "/dishes/quesadillas.jpg",
		notes: "Con salsita. Trae efectivo."
	},
	{
		id: "burger",
		name: "Cheeseburger",
		photo: "/dishes/burger.jpg",
		notes: "Smash con queso americano. Trae efectivo."
	},
	{
		id: "tamales",
		name: "Tamales de puerco",
		photo: "/dishes/tamales.jpg",
		notes: "Tres tamales. Trae efectivo."
	}
];
var TIMEZONE = "America/Chicago";
var PRICE_CENTS = 1e3;
var WEEKDAY_SUN = 0;
function part(parts, type) {
	return parts.find((p) => p.type === type)?.value ?? "";
}
function readClock(date = /* @__PURE__ */ new Date(), tz = TIMEZONE) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: tz,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		weekday: "short"
	}).formatToParts(date);
	const y = part(parts, "year");
	const m = part(parts, "month");
	const d = part(parts, "day");
	const weekdayName = part(parts, "weekday");
	return {
		ymd: `${y}-${m}-${d}`,
		hour: Number(part(parts, "hour")),
		minute: Number(part(parts, "minute")),
		weekday: {
			Sun: 0,
			Mon: 1,
			Tue: 2,
			Wed: 3,
			Thu: 4,
			Fri: 5,
			Sat: 6
		}[weekdayName] ?? WEEKDAY_SUN,
		tz
	};
}
function addDaysYmd(ymd, days) {
	const [y, m, d] = ymd.split("-").map(Number);
	const utc = Date.UTC(y, m - 1, d + days);
	const dt = new Date(utc);
	return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function weekdayIndex(ymd) {
	const [y, m, d] = ymd.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function isWeekend(ymd) {
	const w = weekdayIndex(ymd);
	return w === 0 || w === 6;
}
function nextWeekday(fromYmd) {
	let cursor = fromYmd;
	for (let i = 0; i < 8; i += 1) {
		if (!isWeekend(cursor)) return cursor;
		cursor = addDaysYmd(cursor, 1);
	}
	return fromYmd;
}
/** Next school-day to sell: today if weekday, else next Monday. */
function nextServiceDate(clock) {
	return nextWeekday(clock.ymd);
}
function weekdayLabel(ymd, locale = "es-MX") {
	const [y, m, d] = ymd.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d, 12));
	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: "UTC"
	}).format(dt);
}
function dateLabel(ymd, locale = "es-MX") {
	const [y, m, d] = ymd.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d, 12));
	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		day: "numeric",
		month: "long",
		timeZone: "UTC"
	}).format(dt);
}
function computePhase(opts) {
	if (!opts.serviceDate) return "empty";
	if (opts.status === "cancelled") return "cancelled";
	if (opts.status === "closed") return "ended";
	if (opts.override === "early" || opts.override === "leftover") return opts.override;
	if (opts.clock.ymd < opts.serviceDate) return "early";
	if (opts.clock.ymd > opts.serviceDate) return "ended";
	if (opts.clock.hour < opts.cutoffHour) return "early";
	if (opts.clock.hour >= opts.leftoverEndHour) return "ended";
	return "leftover";
}
function timeLabelFromIso(iso, tz = TIMEZONE) {
	const dt = new Date(iso);
	if (Number.isNaN(dt.getTime())) return "";
	return new Intl.DateTimeFormat("en-US", {
		timeZone: tz,
		hour: "numeric",
		minute: "2-digit"
	}).format(dt);
}
//#endregion
export { computePhase as a, nextServiceDate as c, weekdayLabel as d, addDaysYmd as i, readClock as l, PRICE_CENTS as n, dateLabel as o, TIMEZONE as r, isWeekend as s, DISH_PRESETS as t, timeLabelFromIso as u };
