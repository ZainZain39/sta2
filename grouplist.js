class GroupList extends HTMLElement {
	static get observedAttributes() { return ["format", "group", "list"]; }

	constructor() {
		super();
		this.root = this.attachShadow({mode: "open"});
	}
	attributeChangedCallback(name, oldValue, newValue) {
//		if(oldValue === newValue) return;
		if(name === "group") this.group = newValue;
		if(name === "format") this.format = newValue;
		this.render();
	}
	render() {
		this.root.innerHTML = "";

		const list = this.getAttribute("list");
		if(!list) {
			this.classList.add("reject");
			return;
		}

		const fragment = new DocumentFragment();

		const style = document.createElement("style");
		style.innerHTML = css_grouplist;
		fragment.appendChild(style);

		const div = document.createElement("div");
		fragment.appendChild(div);
		div.classList.add("container");

		div.appendChild(this.createHeader());
		div.appendChild(this.createTitle());
		list.split(",").forEach(v => {
			div.appendChild(this.createItem(v));
		});
		this.root.appendChild(fragment);

		const item_count = this.root.querySelectorAll(".item").length;
		this.classList.toggle("reject", item_count == 0);
	}
	createHeader() {
		const html_default = `
			<div class="header">
				<span>${this.group}</span>
			</div>
		`;
		const LcalGroup = myApp.LocalStringMap.get(this.group) ?? this.group;
		const html = {
			formatStatus: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
			`,
			formatSell: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
			`,
			formatBuy: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
			`,
			formatCheckItem: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
			`,
			formatCheckType: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
			`,
		}
		const tmplate = document.createElement("template");
		tmplate.innerHTML = this.format in html ? html[this.format] : html_default;
		return tmplate.content;
	}
	createTitle() {
		const html_default = ``;
		const html = {
			formatStatus: `
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hstatus">ATK</span>
					<span class="hstatus">DEF</span>
					<span class="hstatus">HP</span>
					<span class="hstatus">EVA</span>
					<span class="hstatus">CRIT</span>
				</div>
			`,
			formatSell: `
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hvalue">価格</span>
					<span class="henergy">割引エネ</span>
					<span class="hcost">コスト</span>
					<span class="hvalue">追加販売価格</span>
					<span class="henergy">追加販売エネ</span>
					<span class="hcost">コスト</span>
					<span class="hsell">推奨販売方法</span>
				</div>
			`,
			formatBuy: `
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hvalue">追加販売価格</span>
					<span class="hvalue">追加販売コスト</span>
					<span class="hvalue">仕入しきい値</span>
				</div>
			`,
			formatCheckItem: `
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hcheck">価格UP</span>
					<span class="hdonate">寄付</span>
				</div>
			`,
			formatCheckType: `
				<div class="title">
					<span class="hname">アイテム名</span>
					<span class="hcheck2">追加料金<br>エネルギー -10%</span>
					<span class="hcheck2">タイプ別<br>追加料金 +5%</span>
					<span class="hcheck2">全アイテム<br>追加料金 +1%</span>
				</div>
			`,
		}
		const tmplate = document.createElement("template");
		tmplate.innerHTML = this.format in html ? html[this.format] : html_default;
		return tmplate.content;
	}
	createItem(key) {
		const func = {
			formatStatus: this.createItem_formatStatus,
			formatSell: this.createItem_formatSell,
			formatBuy: this.createItem_formatBuy,
			formatCheckItem: this.createItem_formatCheckItem,
			formatCheckType: this.createItem_formatCheckType,
			formatXXX: this.createItem_formatXXX,
		}
		if(this.format in func) {
			return func[this.format](key);
		} else {
			return func["formatXXX"](key);
		}
	}
	createItem_formatStatus(key) {
		let {
			Tier, LocalName,
			ATK, DEF, HP, EVA, CRIT,
		} = myApp.ItemMap.get(key) ?? {};

		const tmplate = document.createElement("template");

		const status = selectStatus.value[0];
		if(status === "ATK" && !ATK) return tmplate.content;
		if(status === "DEF" && !DEF) return tmplate.content;
		if(status === "HP" && !HP) return tmplate.content;
		if(status === "EVA" && !EVA) return tmplate.content;
		if(status === "CRIT" && !CRIT) return tmplate.content;

		const qarity = switchQuality.value[0];
		if(ATK) ATK = Math.ceil(ATK * StatusWeight[qarity]);
		if(DEF) DEF = Math.ceil(DEF * StatusWeight[qarity]);
		if(HP) HP = Math.ceil(HP * StatusWeight[qarity]);
		EVA = EVA == 0.05 ? "5%" : EVA;
		CRIT = CRIT == 0.05 ? "5%" : CRIT;

		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${LocalName}">
				<span class="tier">${Tier}</span>
				<span class="name">${LocalName}</span>
				<span class="status">${ATK ?? ""}</span>
				<span class="status">${DEF ?? ""}</span>
				<span class="status">${HP ?? ""}</span>
				<span class="status">${EVA ?? ""}</span>
				<span class="status">${CRIT ?? ""}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatSell(key) {
		const AllValueUp = [...myApp.CheckTypeDbMap].filter(([k, v]) => v.AllValueUp).length;
		const sMaxEnergy = $MaxEnergy.value;
		const sDiscountThreshold = $DiscountThreshold.value;
		const sSurchageThreshold = $SurchageThreshold.value;
		const [MaxEnergy, DiscountThreshold, SurchageThreshold] = String2Number(sMaxEnergy, sDiscountThreshold, sSurchageThreshold);

		let {
			Tier, LocalName, Name, Type,
			Value, IncreaseValue, DiscountEnergy, SurchargeEnergy, SurchargeEnergyCD
		} = myApp.ItemMap.get(key) ?? {};
		const CheckItem = myApp.CheckItemDbMap.get(Name);
		const CheckType = myApp.CheckTypeDbMap.get(Type);

		const qarity = switchQuality.value[0];
		const NowValue = CheckItem?.ValueUp ? IncreaseValue : Value;
		const RoundNowValue = RoundValue(NowValue * ValueWeight[qarity]);
		let DiscountCost, SurchargeValue, NowSurchargeEnergy, SurchargeCost;
		if(Type == "Runestone" || Type == "Moonstone" || Type == "Enchantment") {
			DiscountEnergy = "---";
			DiscountCost = "---";
			SurchargeValue = "---";
			NowSurchargeEnergy = "---";
			SurchargeCost = "---";
		} else {
			DiscountCost = Math.floor(RoundNowValue / 2 / DiscountEnergy);
			SurchargeValue = RoundNowValue * 2;
			NowSurchargeEnergy = CheckType?.CostDown ? SurchargeEnergyCD : SurchargeEnergy;
			SurchargeCost = Math.floor(RoundNowValue / NowSurchargeEnergy);
		}
		const sell = ValueWeight.map(weight => {
			const RoundNowValue = RoundValue(NowValue * weight);
			const SurchageValue = RoundNowValue * (2 + 0.01 * AllValueUp);
			const DiscountCost = Math.floor(RoundNowValue / 2 / DiscountEnergy);
			const NowSurchargeEnergy = CheckType?.CostDown ? SurchargeEnergyCD : SurchargeEnergy;
			const SurchageCost = Math.floor((SurchageValue - RoundNowValue) / NowSurchargeEnergy);

			let sell = "－";
			if(DiscountCost <= DiscountThreshold) sell = "半";
			if(SurchageCost >= SurchageThreshold && NowSurchargeEnergy <= MaxEnergy) sell = "倍";
			return sell;
		});
		const cssValue = CheckItem?.ValueUp ? "value valueup" : "value";
		const cssCost = CheckType?.CostDown ? "energy costdown" : "energy";

		const tmplate = document.createElement("template");

		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${LocalName}">
				<span class="tier">${Tier}</span>
				<span class="name" title="${LocalName}">${LocalName}</span>
				<span class="${cssValue}">${RoundNowValue}</span>
				<span class="energy">${DiscountEnergy}</span>
				<span class="cost">${DiscountCost}</span>
				<span class="value">${SurchargeValue}</span>
				<span class="${cssCost}">${NowSurchargeEnergy}</span>
				<span class="cost">${SurchargeCost}</span>
				<span class="sell quality0">${sell[0]}</span>
				<span class="sell quality1">${sell[1]}</span>
				<span class="sell quality2">${sell[2]}</span>
				<span class="sell quality3">${sell[3]}</span>
				<span class="sell quality4">${sell[4]}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatBuy(key) {
		const AllValueUp = [...myApp.CheckTypeDbMap].filter(([k, v]) => v.AllValueUp).length;
		const sMaxEnergy = $MaxEnergy.value;
		const sDiscountThreshold = $DiscountThreshold.value;
		const sSurchageThreshold = $SurchageThreshold.value;
		const [MaxEnergy, DiscountThreshold, SurchageThreshold] = String2Number(sMaxEnergy, sDiscountThreshold, sSurchageThreshold);

		let {
			Tier, LocalName, Name, Type,
			Value, IncreaseValue, DiscountEnergy, SurchargeEnergy, SurchargeEnergyCD
		} = myApp.ItemMap.get(key) ?? {};
		const CheckItem = myApp.CheckItemDbMap.get(Name);
		const CheckType = myApp.CheckTypeDbMap.get(Type);

		const NowValue = CheckItem?.ValueUp ? IncreaseValue : Value;
		const qarity = switchQuality.value[0];
		const RoundNowValue = RoundValue(NowValue * ValueWeight[qarity]);
		const SurchageValue = Math.floor(RoundNowValue * (2 + 0.01 * AllValueUp));
		const NowSurchargeEnergy = CheckType?.CostDown ? SurchargeEnergyCD : SurchargeEnergy;
		const CostValue = NowSurchargeEnergy * DiscountThreshold;
		const BuyValue = SurchageValue - CostValue;

		const tmplate = document.createElement("template");

		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${LocalName}">
				<span class="tier">${Tier}</span>
				<span class="name" title="${LocalName}">${LocalName}</span>
				<span class="value">${SurchageValue}</span>
				<span class="value">${CostValue}</span>
				<span class="value">${BuyValue}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatCheckItem(key) {
		let {
			Tier, LocalName, Name,
		} = myApp.ItemMap.get(key) ?? {};
		let {
			ValueUp = false, Donation = [false, false, false, false, false],
		} = myApp.CheckItemDbMap.get(Name) ?? {};
		const checked_valueup = ValueUp ? " checked" : "";
		const checked_donation0 = Donation[0] ? " checked" : "";
		const checked_donation1 = Donation[1] ? " checked" : "";
		const checked_donation2 = Donation[2] ? " checked" : "";
		const checked_donation3 = Donation[3] ? " checked" : "";
		const checked_donation4 = Donation[4] ? " checked" : "";

		const tmplate = document.createElement("template");
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${LocalName}">
				<span class="tier">${Tier}</span>
				<span class="name">${LocalName}</span>
				<label class="check"><input type="checkbox" data--name="${Name}" data-key="ValueUp"${checked_valueup}></label>
				<label class="donate quality0"><input type="checkbox" data--name="${Name}" data-key="Donation" data-i="0"${checked_donation0}></label>
				<label class="donate quality1"><input type="checkbox" data--name="${Name}" data-key="Donation" data-i="1"${checked_donation1}></label>
				<label class="donate quality2"><input type="checkbox" data--name="${Name}" data-key="Donation" data-i="2"${checked_donation2}></label>
				<label class="donate quality3"><input type="checkbox" data--name="${Name}" data-key="Donation" data-i="3"${checked_donation3}></label>
				<label class="donate quality4"><input type="checkbox" data--name="${Name}" data-key="Donation" data-i="3"${checked_donation4}></label>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatCheckType(key) {
		let {
			Type = key, CostDown = false, TypeValueUp = false, AllValueUp = false,
		} = myApp.CheckTypeDbMap.get(key) ?? {};
		const LocalType = myApp.LocalStringMap.get(Type) ?? Type;
		const checked_costdown = CostDown ? " checked" : "";
		const checked_typevalueup = TypeValueUp ? " checked" : "";
		const checked_allvalueup = AllValueUp ? " checked" : "";

		const tmplate = document.createElement("template");
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${LocalType}">
				<span class="type" title="${LocalType}">${LocalType}</span>
				<label class="check2"><input type="checkbox" data--name="${Type}" data-key="CostDown"${checked_costdown}></label>
				<label class="check2"><input type="checkbox" data--name="${Type}" data-key="TypeValueUp"${checked_typevalueup}></label>
				<label class="check2"><input type="checkbox" data--name="${Type}" data-key="AllValueUp"${checked_allvalueup}></label>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatXXX(key) {
		const tmplate = document.createElement("template");
		tmplate.innerHTML = `
			<div class="item" title="${key}">
				<span class="name">${key}</span>
			</div>
		`;
		return tmplate.content;
	}
}
const css_grouplist = `
.container {
	background: #fff;
	color: #000;
}
.header {
	display: flex;
	gap: 5px;
	border-bottom: 1px solid #000;
	padding: 3px 5px;
	font-weight: bold;
	background: #ff9;
}
.title {
	display: flex;
	gap: 5px;
	font-weight: bold;
	padding: 3px 5px 0;
}
.item {
	display: flex;
	gap: 5px;
	display: flex;
	gap: 5px;
	padding: 0 5px 0;
}
.item:nth-child(2n) {
	background-color: #dfe;
}
.item:hover {
	font-weight: bold;
}

.htier {
	width: 25px;
	border-bottom: 1px dashed #000;
}
.hname {
	width: 120px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	border-bottom: 1px dashed #000;
}
.hstatus {
	width: 40px;
	border-bottom: 1px dashed #000;
	text-align: center;
}
.hcheck {
	width: 50px;
	border-bottom: 1px dashed #000;
	text-align: center;
}
.hcheck2 {
	width: 100px;
	border-bottom: 1px dashed #000;
	text-align: center;
}
.hdonate {
	width: 145px;
	border-bottom: 1px dashed #000;
	text-align: center;
}
.hsell {
	width: 150px;
	border-bottom: 1px dashed #000;
	text-align: center;
}
.hvalue {
	width: 100px;
	border-bottom: 1px dashed #000;
	margin-left: 5px;
	text-align: center;
}
.henergy {
	width: 80px;
	border-bottom: 1px dashed #000;
	margin-left: 5px;
	text-align: center;
}
.hcost {
	width: 40px;
	border-bottom: 1px dashed #000;
	margin-left: 5px;
	text-align: center;
}

.tier {
	width: 25px;
	text-align: right;
}
.tier::after {
	content: ".";
}
.name {
	width: 120px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}
.type {
	width: 120px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}
.status {
	width: 40px;
	text-align: right;
}
.check {
	width: 50px;
	text-align: center;
}
.check2 {
	width: 100px;
	text-align: center;
}
.donate {
	width: 25px;
	text-align: center;
}
.sell {
	width: 20px;
	text-align: center;
}
.value {
	width: 100px;
	text-align: right;
	margin-left: 5px;
}
.energy {
	width: 80px;
	text-align: right;
	margin-left: 5px;
}
.cost {
	width: 40px;
	text-align: right;
	margin-left: 5px;
}

.valueup {
	color: #00f;
}
.costdown {
	color: #00f;
}

.quality0 {
	background-color: #b2b2b2;
}
.quality1 {
	background-color: #60ff9c;
}
.quality2 {
	background-color: #5df8ff;
}
.quality3 {
	background-color: #d342ff;
}
.quality4 {
	background-color: #ffe250;
}
`;
customElements.define("group-list", GroupList);
