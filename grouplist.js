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
		list.split(",").forEach(v => {
			div.appendChild(this.createItem(v));
		});
		this.root.appendChild(fragment);

		this.root.querySelectorAll(".changeCheckItem").forEach(e => {
			e.addEventListener("change", changeCheckItem)
		});

		this.root.querySelectorAll(".changeCheckType").forEach(e => {
			e.addEventListener("change", changeCheckType)
		});

		this.root.querySelectorAll(".clickRate").forEach(e => {
			e.addEventListener("click", changeRate);
		});

		const item_count = this.root.querySelectorAll(".item").length;
		this.classList.toggle("reject", item_count == 0);
	}
	createHeader() {
		const LcalGroup = myApp.LocalStringMap.get(this.group) ?? this.group;
		const html = {
			formatStatus: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
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
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hvalue">価格</span>
					<span class="henergy">割引エネ</span>
					<span class="hcost">コスト</span>
					<span class="hvalue">追加販売価格</span>
					<span class="henergy">追加販売エネ</span>
					<span class="hcost">還元率</span>
					<span class="hsell">推奨販売方法</span>
				</div>
			`,
			formatMarket: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hvalue">追加販売価格</span>
					<span class="hvalue">追加販売コスト</span>
					<span class="hvalue">推奨仕入価格</span>
				</div>
			`,
			formatEnchantment: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hvalue">エンチャント前</span>
					<span class="hvalue">増加額</span>
					<span class="hvalue">エンチャント後</span>
					<span class="hvalue">追加販売価格</span>
					<span class="hcost">還元率</span>
				</div>
			`,
			formatCheckItem: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
				<div class="title">
					<span class="htier"></span>
					<span class="hname">アイテム名</span>
					<span class="hcheck">価格UP</span>
				</div>
			`,
			formatCheckType: `
				<div class="header">
					<span>${LcalGroup}</span>
				</div>
				<div class="title">
					<span class="hname">アイテム名</span>
					<span class="hcheck2">追加料金<br>エネルギー -10%</span>
					<span class="hcheck2">タイプ別<br>追加料金 +5%</span>
					<span class="hcheck2">全アイテム<br>追加料金 +1%</span>
				</div>
			`,
			formatDefault: `
				<div class="header">
					<span>${this.group}</span>
				</div>
			`,
		}
		const tmplate = document.createElement("template");
		tmplate.innerHTML = html[this.format in html ? this.format : "formatDefault"];
		return tmplate.content;
	}
	createItem(key) {
		const func = {
			formatSell: this.createItem_formatSell,
			formatMarket: this.createItem_formatMarket,
			formatEnchantment: this.createItem_formatEnchantment,
			formatStatus: this.createItem_formatStatus,
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
		const item = myApp.ItemMap.get(key);
		const tmplate = document.createElement("template");
		const status = selectStatus.value[0];
		if(status != "on" && !(status in item)) return tmplate.content;
		const qarity = switchQuality.value[0];
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${item.LocalName}">
				<span class="tier">${item.Tier}</span>
				<span class="name">${item.LocalName}</span>
				<span class="status">${item.getATK[qarity]}</span>
				<span class="status">${item.getDEF[qarity]}</span>
				<span class="status">${item.getHP[qarity]}</span>
				<span class="status">${item.getEVA}</span>
				<span class="status">${item.getCRIT}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatSell(key) {
		const sMaxEnergy = $MaxEnergy.value;
		const sDiscountThreshold = $DiscountThreshold.value;
		const sSurchargeThreshold = $SurchargeThreshold.value;
		const [MaxEnergy, DiscountThreshold, SurchargeThreshold] = String2Number(sMaxEnergy, sDiscountThreshold, sSurchargeThreshold);
		const qarity = switchQuality.value[0];

		const item = myApp.ItemMap.get(key);
		const sell = ["－", "－", "－", "－", "－"];
		const DiscountCost = [];
		const SurchargeValue = [];
		const SurchargeCost = [];
		sell.forEach((_,i) => {
			DiscountCost[i] = Math.floor(item.RoundNowValue[i] / 2 / item.DiscountEnergy);
			SurchargeValue[i] = Math.floor((item.RoundNowValue[i] * (200 + myApp.AllValueUp + (item.CheckType.TypeValueUp ? 5 : 0)) / 100));
			SurchargeCost[i] = Math.floor((SurchargeValue[i] - item.RoundNowValue[i]) / item.NowSurchargeEnergy);

			if(DiscountCost[i] <= DiscountThreshold) sell[i] = "半";
			if(SurchargeCost[i] >= SurchargeThreshold && item.NowSurchargeEnergy <= MaxEnergy) sell[i] = "倍";
		});
		const cssValue = item.CheckItem.ValueUp ? "value valueup" : "value";
		const cssCost = item.CheckType.CostDown ? "energy costdown" : "energy";

		const tmplate = document.createElement("template");
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${item.LocalName}">
				<span class="tier">${item.Tier}</span>
				<span class="name">${item.LocalName}</span>
				<span class="${cssValue}">${item.RoundNowValue[qarity]}</span>
				<span class="energy">${item.DiscountEnergy}</span>
				<span class="cost">${DiscountCost[qarity]}</span>
				<span class="value">${SurchargeValue[qarity]}</span>
				<span class="${cssCost}">${item.NowSurchargeEnergy}</span>
				<span class="cost">${SurchargeCost[qarity]}</span>
				<span class="sell quality0">${sell[0]}</span>
				<span class="sell quality1">${sell[1]}</span>
				<span class="sell quality2">${sell[2]}</span>
				<span class="sell quality3">${sell[3]}</span>
				<span class="sell quality4">${sell[4]}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatMarket(key) {
		const sMaxEnergy = $MaxEnergy.value;
		const sDiscountThreshold = $DiscountThreshold.value;
		const sSurchargeThreshold = $SurchargeThreshold.value;
		const [MaxEnergy, DiscountThreshold, SurchargeThreshold] = String2Number(sMaxEnergy, sDiscountThreshold, sSurchargeThreshold);
		const qarity = switchQuality.value[0];

		const item = myApp.ItemMap.get(key);
		const DiscountCost = Math.floor(item.RoundNowValue[qarity] / 2 / item.DiscountEnergy);
		const SurchargeValue = Math.floor((item.RoundNowValue[qarity] * (200 + myApp.AllValueUp + (item.CheckType.TypeValueUp ? 5 : 0)) / 100));
		const SurchargeCost = Math.floor((SurchargeValue - item.RoundNowValue[qarity]) / item.NowSurchargeEnergy);
		const Cost = item.NowSurchargeEnergy * sDiscountThreshold;
		const BuyValue = SurchargeValue - Cost;

		const tmplate = document.createElement("template");
		if(!(SurchargeCost >= SurchargeThreshold && item.NowSurchargeEnergy <= MaxEnergy)) return tmplate.content;
		tmplate.innerHTML = tagLocalNumber`
			<div class="item clickRate" title="${item.LocalName}" data-value="${BuyValue}">
				<span class="tier">${item.Tier}</span>
				<span class="name">${item.LocalName}</span>
				<span class="value">${SurchargeValue}</span>
				<span class="value">${Cost}</span>
				<span class="value">${BuyValue}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatEnchantment(key) {
		const sMaxEnergy = $MaxEnergy.value;
		const sSurchargeThreshold = $SurchargeThreshold.value;
		const sElementValue = $ElementValue.value;
		const sSpiritValue = $SpiritValue.value;
		const [MaxEnergy, SurchargeThreshold, ElementValue, SpiritValue] = String2Number(sMaxEnergy, sSurchargeThreshold, sElementValue, sSpiritValue);
		const qarity = switchQuality.value[0];

		const item = myApp.ItemMap.get(key);
		const tmplate = document.createElement("template");
		if(ElementValue != 0 && item.EnchantedE) return tmplate.content;
		if(SpiritValue != 0 && item.EnchantedS) return tmplate.content;
		if(item.NowSurchargeEnergy > MaxEnergy) return tmplate.content;

		const RoundNowValue = RoundValue(item.NowValue[0] * ValueWeight[qarity] / 100);
		const RoundEnchantValue = RoundValue((item.NowValue[0] + Math.min(item.NowValue[0], ElementValue) + Math.min(item.NowValue[0], SpiritValue)) * ValueWeight[qarity] / 100);
		const DiffValue = RoundEnchantValue - RoundNowValue;
		const SurchargeValue = Math.floor((RoundEnchantValue * (200 + myApp.AllValueUp + (item.CheckType.TypeValueUp ? 5 : 0)) / 100));
		const SurchargeCost = Math.floor((SurchargeValue- RoundNowValue) / item.NowSurchargeEnergy);
		if(SurchargeCost < SurchargeThreshold) return tmplate.content;
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${item.LocalName}">
				<span class="tier">${item.Tier}</span>
				<span class="name">${item.LocalName}</span>
				<span class="value">${RoundNowValue}</span>
				<span class="value">${DiffValue}</span>
				<span class="value">${RoundEnchantValue}</span>
				<span class="value">${SurchargeValue}</span>
				<span class="cost">${SurchargeCost}</span>
			</div>
		`;
		return tmplate.content;
	}
	createItem_formatCheckItem(key) {
		const item = myApp.ItemMap.get(key);

		const checked_valueup = item.CheckItem.ValueUp ? " checked" : "";

		const tmplate = document.createElement("template");
		tmplate.innerHTML = tagLocalNumber`
			<div class="item" title="${item.LocalName}">
				<span class="tier">${item.Tier}</span>
				<span class="name">${item.LocalName}</span>
				<label class="check"><input type="checkbox" class="changeCheckItem" data--name="${item.Name}" data-key="ValueUp"${checked_valueup}></label>
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
				<label class="check2"><input type="checkbox" class="changeCheckType" data--name="${Type}" data-key="CostDown"${checked_costdown}></label>
				<label class="check2"><input type="checkbox" class="changeCheckType" data--name="${Type}" data-key="TypeValueUp"${checked_typevalueup}></label>
				<label class="check2"><input type="checkbox" class="changeCheckType" data--name="${Type}" data-key="AllValueUp"${checked_allvalueup}></label>
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
label {
	cursor: pointer;
}

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
.hsell {
	width: 120px;
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
