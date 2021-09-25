const myApp = {};
document.addEventListener("DOMContentLoaded", async () => {
	setResizeObserver();
	await setupData();
	setViewItem();
	setViewCheckType();
	setDragEvent();
	setEvent();
	document.querySelector(".loading").classList.add("reject");
	document.querySelector("main").classList.remove("reject");
});

const setResizeObserver = () => {
	const headerResizeObserver = new ResizeObserver(entries => {
		document.querySelector("body").style.marginTop = `${entries[0].target.offsetHeight}px`;
	});
	headerResizeObserver.observe(document.querySelector("header"));

	const footerResizeObserver = new ResizeObserver(entries => {
		document.querySelector("body").style.marginBottom = `${entries[0].target.offsetHeight}px`;
		document.querySelector(".loading").style.bottom = `${entries[0].target.offsetHeight}px`;
	});
	footerResizeObserver.observe(document.querySelector('footer'));
}

const setupData = async () => {
	const init_para = [
		["MaxEnergy", "3,000"],
		["DiscountThreshold", "500"],
		["SurchargeThreshold", "800"],
	];
	const dbconfig1 = new DbConfig().setStore("para");
	myApp.ParaDbMap = await new DbMap(init_para).setDbConfig(dbconfig1);
	$MaxEnergy.value = myApp.ParaDbMap.get("MaxEnergy");
	$DiscountThreshold.value = myApp.ParaDbMap.get("DiscountThreshold");
	$SurchargeThreshold.value = myApp.ParaDbMap.get("SurchargeThreshold");

	const init_checkitem = {
		ValueUp: false,
	}
	const dbconfig2 = new DbConfig().setStore("CheckItem").setInit(init_checkitem);
	myApp.CheckItemDbMap = await new DbMap().setDbConfig(dbconfig2);

	const init_checktype = {
		CostDown: false,
		TypeValueUp: false,
		AllValueUp: false,
	}
	const dbconfig3 = new DbConfig().setStore("CheckType").setInit(init_checktype);
	myApp.CheckTypeDbMap = await new DbMap().setDbConfig(dbconfig3);
	myApp.AllValueUp = [...myApp.CheckTypeDbMap].filter(([k, v]) => v.AllValueUp).length;

	myApp.ItemMap = new Map();
	myApp.LocalStringMap = new Map(convEntries(LocalString));
	const EnchantedEMap = new Map(convEntries(EnchantedE));
	const EnchantedSMap = new Map(convEntries(EnchantedS));
	const rejectType = ["Runestone", "Moonstone", "Enchantment"];
	ItemEntries().forEach(([k, v]) => {
		if(rejectType.includes(v.Type)) return;
		v.LocalName = myApp.LocalStringMap.get(k) ?? k;
		v.EnchantedE = EnchantedEMap.has(k);
		v.EnchantedS = EnchantedSMap.has(k);
		myApp.ItemMap.set(k, new ItemObject(v));
	});
}

class ItemObject {
	constructor(e) {
		Object.entries(e).forEach(([k, v]) => this[k] = v);
		this.CheckItem = myApp.CheckItemDbMap.get(this.Name);
		this.CheckType = myApp.CheckTypeDbMap.get(this.Type);
	}
	get NowValue() {
		const temp = this.CheckItem.ValueUp ? this.IncreaseValue : this.Value;
		return [
			temp * ValueWeight[0] / 100,
			temp * ValueWeight[1] / 100,
			temp * ValueWeight[2] / 100,
			temp * ValueWeight[3] / 100,
			temp * ValueWeight[4] / 100,
		];
	}
	get RoundNowValue() {
		return [
			RoundValue(this.NowValue[0]),
			RoundValue(this.NowValue[1]),
			RoundValue(this.NowValue[2]),
			RoundValue(this.NowValue[3]),
			RoundValue(this.NowValue[4]),
		];
	}
//	get DiscountCost() {
//		return [
//			Math.floor(this.RoundNowValue[0] / 2 / this.DiscountEnergy),
//			Math.floor(this.RoundNowValue[1] / 2 / this.DiscountEnergy),
//			Math.floor(this.RoundNowValue[2] / 2 / this.DiscountEnergy),
//			Math.floor(this.RoundNowValue[3] / 2 / this.DiscountEnergy),
//			Math.floor(this.RoundNowValue[4] / 2 / this.DiscountEnergy),
//		];
//	}
//	get SurchargeValue() {
//		return [
//			this.RoundNowValue[0] * 2,
//			this.RoundNowValue[1] * 2,
//			this.RoundNowValue[2] * 2,
//			this.RoundNowValue[3] * 2,
//			this.RoundNowValue[4] * 2,
//		];
//	}
	get NowSurchargeEnergy() {
		return this.CheckType.CostDown ? this.SurchargeEnergyCD : this.SurchargeEnergy;
	}
//	get SurchargeCost() {
//		return [
//			Math.floor(this.RoundNowValue[0] / this.NowSurchargeEnergy),
//			Math.floor(this.RoundNowValue[1] / this.NowSurchargeEnergy),
//			Math.floor(this.RoundNowValue[2] / this.NowSurchargeEnergy),
//			Math.floor(this.RoundNowValue[3] / this.NowSurchargeEnergy),
//			Math.floor(this.RoundNowValue[4] / this.NowSurchargeEnergy),
//		];
//	}
	get getATK() {
		if(!("ATK" in this)) return ["", "", "", "", ""];
		return [
			Math.round(this.ATK * StatusWeight[0] / 100),
			Math.round(this.ATK * StatusWeight[1] / 100),
			Math.round(this.ATK * StatusWeight[2] / 100),
			Math.round(this.ATK * StatusWeight[3] / 100),
			Math.round(this.ATK * StatusWeight[4] / 100),
		];
	}
	get getDEF() {
		if(!("DEF" in this)) return ["", "", "", "", ""];
		return [
			Math.round(this.DEF * StatusWeight[0] / 100),
			Math.round(this.DEF * StatusWeight[1] / 100),
			Math.round(this.DEF * StatusWeight[2] / 100),
			Math.round(this.DEF * StatusWeight[3] / 100),
			Math.round(this.DEF * StatusWeight[4] / 100),
		];
	}
	get getHP() {
		if(!("HP" in this)) return ["", "", "", "", ""];
		return [
			Math.round(this.HP * StatusWeight[0] / 100),
			Math.round(this.HP * StatusWeight[1] / 100),
			Math.round(this.HP * StatusWeight[2] / 100),
			Math.round(this.HP * StatusWeight[3] / 100),
			Math.round(this.HP * StatusWeight[4] / 100),
		];
	}
	get getEVA() {
		if(!("EVA" in this)) return "";
		return this.EVA === 0.05 ? "5%" : EVA;
	}
	get getCRIT() {
		if(!("CRIT" in this)) return "";
		return this.CRIT === 0.05 ? "5%" : CRIT;
	}
}

const ItemEntries = () => {
	return ItemList.map(data => {
		const {
			Name, Type, Tier, Value: sValue,
			ATK: sATK, DEF: sDEF, HP: sHP, EVA: sEVA, CRIT: sCRIT,
			"Unlock Prerequisite": UP,
			"Crafting Upgrade 1": CU1, "Crafting Upgrade 2": CU2, "Crafting Upgrade 3": CU3, "Crafting Upgrade 4": CU4, "Crafting Upgrade 5": CU5,
			"Discount Energy": sDiscountEnergy, "Surcharge Energy": sSurchargeEnergy
		} = data;

		const [Value, ATK, DEF, HP, EVA, CRIT, DiscountEnergy, SurchargeEnergy] = String2Number(sValue, sATK, sDEF, sHP, sEVA, sCRIT, sDiscountEnergy, sSurchargeEnergy);

		const ValueIncrease = [CU1, CU2, CU3, CU4, CU5].includes("x1.5 Value Increase")
			? 1.5
			: [CU1, CU2, CU3, CU4, CU5].includes("x1.25 Value Increase")
			? 1.25
			: 1;
		const IncreaseValue = Value * ValueIncrease;
		const SurchargeEnergyCD = Math.floor(SurchargeEnergy * 0.9);
		const GoldenChest = UP == "Golden Chest";

		const result = {
			Name, Type, Tier, Value, IncreaseValue,
			DiscountEnergy, SurchargeEnergy, SurchargeEnergyCD,
			ATK, DEF, HP, EVA, CRIT,
			GoldenChest
		};

		if(isNaN(ATK))  delete result.ATK;
		if(isNaN(DEF))  delete result.DEF;
		if(isNaN(HP))   delete result.HP;
		if(isNaN(EVA))  delete result.EVA;
		if(isNaN(CRIT)) delete result.CRIT;

		return [Name, result];
	});
}
const convEntries = data => data.split("\n").filter(Boolean).map(d => d.split("\t"));

const equalConditions = ["boolean", "number", "string"];
const filterProp = (key, target) => v => equalConditions.includes(typeof target) ? v[key] === target : target.includes(v[key]);
const getProp = key => v => v[key];
const String2Number = (...args) => args.map(s => Number(s.replaceAll(",", "")));

const ValueWeight = [100, 125, 200, 300, 500];
const StatusWeight = [100, 125, 150, 200, 300];
const RoundValue = value => {
	let                  x = 50000;
	if(value <= 1000000) x =  5000;
	if(value <=  100000) x =   500;
	if(value <=   10000) x =    50;
	if(value <=    1000) x =    10;
	return Math.round(value / x) * x;
}
const tagLocalNumber = (sList, ...vList) => {
	const LocalValue = v => {
		return v.toLocaleString();
	}
	return vList
		.map((v, i) => sList[i] + LocalValue(v))
		.concat(sList.slice(vList.length))
		.join("")
	;
}

const setViewItem = () => {
	const fragment = new DocumentFragment();
	const groupList = [
		"Sword", "Axe", "Dagger", "Mace", "Spear", "Bow", "Wand", "Staff", "Gun", "Crossbow",
		"Heavy Armor", "Light Armor", "Clothes", "Helmet", "Rogue Hat", "Magician Hat", "Gauntlets", "Gloves", "Heavy Footwear", "Light Footwear",
		"Herbal Medicine", "Potion", "Spell", "Shield", "Ring", "Amulet",
	];
	groupList.forEach(group => {
		const grouplist = document.createElement("group-list");
		grouplist.classList.add("targetList");
		grouplist.setAttribute("format", "");
		grouplist.setAttribute("key", "Type");
		grouplist.setAttribute("group", group);
		fragment.appendChild(grouplist);
	});
	$viewItem.appendChild(fragment);
};

const setViewCheckType = () => {
	const fragment = new DocumentFragment();
	const groupList = {
		GroupA: ["Sword", "Axe", "Dagger", "Mace", "Spear", "Bow", "Wand", "Staff", "Gun", "Crossbow"],
		GroupB: ["Heavy Armor", "Light Armor", "Clothes","Helmet", "Rogue Hat", "Magician Hat", "Gauntlets", "Gloves"],
		GroupC: ["Heavy Footwear","Light Footwear", "Herbal Medicine", "Potion", "Spell", "Shield", "Ring", "Amulet"],
		GroupD: ["Stone"],
		GroupE: ["Element","Spirit"],
	};
	Object.entries(groupList).forEach(([k, v]) => {
		const grouplist = document.createElement("group-list");
		grouplist.setAttribute("format", "formatCheckType");
		grouplist.setAttribute("group", k);
		grouplist.setAttribute("list", v);
		fragment.appendChild(grouplist);
	});
	$viewCheckType.appendChild(fragment);
};

const setDragEvent = () => {
	const mdown = e => {
		e.currentTarget.classList.add("drag");
		myApp.x = e.pageX - e.currentTarget.offsetLeft;
		myApp.y = e.pageY - e.currentTarget.offsetTop;
		document.body.addEventListener("mousemove", mmove);
	}
	const mmove = e => {
		e.preventDefault();
		const drag = document.querySelector(".drag");
		drag.style.top = `${e.pageY - myApp.y}px`;
		drag.style.left = `${e.pageX - myApp.x}px`;
		drag.addEventListener("mouseup", mup);
	}
	const mup = e => {
		document.body.removeEventListener("mousemove", mmove);
		const drag = document.querySelector(".drag");
		drag.removeEventListener("mouseup", mup);
		drag.classList.remove("drag");
	}
	document.querySelectorAll(".drag-and-drop").forEach(e => e.addEventListener("mousedown", mdown));
}

const setEvent = () => {
	document.querySelectorAll(".changeList").forEach(e => {
		e.addEventListener("changed", () => {
			const targetTier = filterTier.value;
			const targetType = filterRack.value;
			showFilterType.setAttribute("select", targetType);

			document.querySelectorAll(".targetList").forEach(e => {
				const key = e.getAttribute("key");
				const group = e.getAttribute("group");
				const list = [...myApp.ItemMap.values()]
					.filter(filterProp(key, group))
					.filter(filterProp("Tier", targetTier))
					.filter(filterProp("Type", targetType))
					.map(getProp("Name"));
				e.setAttribute("list", list);
			});
		});
		e.addEventListener("change", () => {
			const targetTier = filterTier.value;
			const targetType = filterRack.value;
			showFilterType.setAttribute("select", targetType);

			document.querySelectorAll(".targetList").forEach(e => {
				const key = e.getAttribute("key");
				const group = e.getAttribute("group");
				const list = [...myApp.ItemMap.values()]
					.filter(filterProp(key, group))
					.filter(filterProp("Tier", targetTier))
					.filter(filterProp("Type", targetType))
					.map(getProp("Name"));
				e.setAttribute("list", list);
			});
		});
	});

	document.querySelectorAll(`[type="text"]`).forEach(e => {
		e.addEventListener("focus", e => {
			const me = e.currentTarget;
			me.value = me.value.replaceAll(",", "");
			me.select();
		});
		e.addEventListener("blur", async e => {
			const me = e.currentTarget;
			me.value = (isNaN(me.value) ? 0 : Number(me.value.replaceAll(",", ""))).toLocaleString();
			await myApp.ParaDbMap.set(me.dataset.para, me.value);
		});
	});

	filterTier.dispatchEvent(event);

	document.querySelectorAll(".changeView").forEach(e => {
		e.addEventListener("changed", e => {
			const view = e.currentTarget.value[0];
			document.querySelectorAll(".targetView").forEach(e => e.classList.toggle("reject", !e.classList.contains(view)));
		});
	});
	document.querySelectorAll(".changeView2").forEach(e => {
		e.addEventListener("changed", e => {
			const view = e.currentTarget.value[0];
			const format = selectFormat.value[0];
			if(view === "viewItem") document.querySelectorAll(".targetList").forEach(e => e.setAttribute("format", format));
			if(view === "viewCheckType") document.querySelectorAll(".targetList").forEach(e => e.setAttribute("format", "formatCheckType"));
		});
	});
	selectView.dispatchEvent(event);

	document.querySelectorAll(".changeFormat").forEach(e => {
		e.addEventListener("changed", e => {
			const format = e.currentTarget.value[0];
			document.querySelectorAll(".targetFormat").forEach(e => e.classList.toggle("reject", !e.classList.contains(format)));
			document.querySelectorAll(".targetList").forEach(e => e.setAttribute("format", format));
		});
	});
	selectFormat.dispatchEvent(event);

	window.addEventListener("scroll", () => {
		clearTimeout(myApp.timer);
		myApp.timer = setTimeout(() => {
			toTop.classList.toggle("reject", window.pageYOffset == 0);
		}, 300);
	});
	toTop.addEventListener("click", () => {
		window.scroll({top: 0, behavior: "smooth"});
	});
}

const event = new CustomEvent("changed", {
	bubbles: true,
	composed: true,
});

const changeCheckItem = async e => {
	const me = e.currentTarget;
	const {Name, key} = me.dataset;
	const checkitem = myApp.CheckItemDbMap.get(Name);
	checkitem[key] = me.checked;
	await myApp.CheckItemDbMap.set(Name, checkitem);
}

const changeCheckType = async e => {
	const me = e.currentTarget;
	const {Name, key} = me.dataset;
	const checktype = myApp.CheckTypeDbMap.get(Name);
	checktype[key] = me.checked;
	await myApp.CheckTypeDbMap.set(Name, checktype);

	if(key === "AllValueUp") myApp.AllValueUp = [...myApp.CheckTypeDbMap].filter(([k, v]) => v.AllValueUp).length;
}

const changeRate = e => {
	const me = e.currentTarget;
	const sGold = me.dataset.value;
	const sRate = $Rate.value;
	const [Gold, Rate] = String2Number(sGold, sRate);
	const Gem = Math.ceil(Gold / Rate);
	const GetGold = Math.ceil(Gold / 0.9);
	const GetGem = Math.ceil(Gem / 0.8);

	$gold.value = tagLocalNumber`${Gold}`;
	$gem.value = tagLocalNumber`${Gem}`;
	$getgold.value = tagLocalNumber`${GetGold}`;
	$getgem.value = tagLocalNumber`${GetGem}`;
}

const EnchantedE = `
Canopy Cap
Trailblazers
Ice Pick
Scroll of Cleansing
Tailwind
Darkwood Branch
Arboreal Blade
Swift Mitts
Emerald Ring
Aurum Ward
Molten Voulge
Eclipse Amulet
Tome of the Night
Brinewater Helm
Amber Staff
Ceremonial Breastplate
Cindersole
Hat of the Four Winds
Triton Lance
Vestal Raiments
Sungrasp Gauntlets
Glade Guard Armor
Quetzalcoatl
Black Wyrm Claws
Meteor Hammer
Stonesplitter
Nomad Veil	
Brinewater Do
Bottled Mirth
Soulstone Ring
Damocles
Levia Fang
Mistpeak Bloom
Alpine Stride
Crusader Helmet
Phoenix Staff
Prometheon
Tidebringer
Gaia Enforcer
Storm Dragon Mask
Purgatory
Plaguewalkers
Amber Citadel
Northwind Gem
Caladbolg
Terra Tyrannis
Longinus
Nightmare Fellblade
Phoenix Litany
Monsoon Heart
Bleakspire Roots
Last Breath
Sunglow Impact
Abyssal Hood
`;

const EnchantedS = `
Mundra's Masher
Mundra's Hornbow
Mundra's Scepter
Mundra's Tabard
Mundra's Amulet
`;

const LocalString = `
Sword	剣
Axe	斧
Dagger	短刀
Mace	メイス
Spear	槍
Bow	弓
Wand	杖
Staff	ステッキ
Gun	銃
Crossbow	クロスボウ
Heavy Armor	ヘビーアーマー
Light Armor	ライトアーマー
Clothes	衣服
Helmet	ヘルメット
Rogue Hat	ローグの帽子
Magician Hat	魔術師の帽子
Gauntlets	ガントレット
Gloves	ブレイザー
Heavy Footwear	フットウェア（重）
Light Footwear	フットウェア（軽）
Herbal Medicine	植物薬
Potion	ポーション
Spell	呪文
Shield	盾
Ring	リング
Amulet	アミュレット
Stone	ストーン
Runestone	ルーンストーン
Moonstone	ムーンストーン
Enchantment	エンチャント
Element	エレメント
Spirit	精霊
GroupA	武器
GroupB	アーマー
GroupC	アクセサリー
GroupD	ストーン
GroupE	付与魔法
Fighter	ファイター
Rogue	ローグ
Spellcaster	スペルキャスター
Soldier	ソルジャー
Mercenary	マーセナリー
Barbarian	バーバリアン
Chieftain	族長
Knight	ナイト
Lord	ロード
Ranger	レンジャー
Warden	ウォーデン
Samurai	サムライ
Daimyo	ダイミョウ
Berserker	狂戦士
Jarl	ヤール
Thief	シーフ
Trickster	トリックスター
Monk	モンク
Grandmaster	グランドマスター
Musketeer	銃士
Conquistador	コンキスタドール
Wanderer	ワンダラー
Pathfinder	パスファインダー
Ninja	忍者
Sensei	センセイ
Dancer	踊り子
Acrobat	軽業師
Mage	メイジ
Archmage	アークメイジ
Cleric	クレリック
Bishop	ビショップ
Druid	ドルイド
Arch Druid	アークドルイド
Sorcerer	ソーサラー
Warlock	ウォーロック
Spellblade	スペルブレイド
Spellknight	スペルナイト
Geomancer	風水師
Astramancer	アストラマンサー
Opulent Pistol	豪勢なピストル
Squire Sword	スクワイアソード
Arming Sword	アーミングソード
Gladius	グラディウス
Arboreal Blade	新緑のブレード
Zweihander	ツヴァイハンダー
Cutlass	カットラス
Espada	エスパーダ
Hero's Sword	ヒーローの剣
Katana	刀
Serrated Cinquedea	鋸歯のチンクエディア
Regal Blade	荘厳な小太刀
Celesteel Blade	セレスティール・ブレード
Damocles	ダモクレス
Luxurious Macuahuitl	豪華なマクアフティル
Mythril Edge	ミスリルエッジ
Seafarer Blade	船乗りの刃
Gentleman Blade	紳士のブレード
Oversized Cleaver	特大の包丁
Caladbolg	カラドボルグ
Dragon Dao	ドラゴンダオ
Vorpal Sword	ボーパルの剣
Elegant Rapier	エレガントなレイピア
Wood Axe	ウッドアックス
Hatchet	手おの
Iron Chopper	アイアンチョッパー
Explorer's Axe	探検者のアックス
Bardiche	バルディッシュ
Molten Voulge	灼熱の斧槍
Tomahawk	トマホーク
Companion Axe	斧の相棒
Battleaxe	戦斧
Raptor Reaper	猛禽類の死神
Dwarven Greataxe	ドワーフの大斧
Stonesplitter	ストーンスプリッター
Raider Axe	レイダーアックス
Executioner	エグゼキューショナー
Purgatory	パーガトリー
Axe of The Fifth	5月の斧
Eclipsis	エクリプシス
Terra Tyrannis	大地のティラニス
Opulent Grandaxe	贅沢な大斧
Kodiak Kleaver	コディアックの包丁
Manticore Slayer	マンティコアスレイヤー
Beeswaxe	蜜蝋
Shiv	飛び出しナイフ
Ice Pick	アイスピック
Swift Blade	速小太刀
Kunai	くない
Stealth Knife	ステルスナイフ
Balisong	バタフライナイフ
Erudite Vector	学究的ベクトル
Ritual Dagger	儀式用短剣
Assassin Tanto	暗殺者タント
Kingsguard	キングズガード
Cloudwalker Chakram	雲歩く者のチャクラ
Fishmonger	魚屋
Troll Tooth	トロールの牙
Levia Fang	レヴィアファング
Misericordia	ミゼリコルディア
Sultan Dagger	サルタンの短剣
Luxurious Poignard	豪華なポワニャール
Ceremonial Katar	儀礼用のカタール
Nightmare Fellblade	悪夢のフェルブレード
Swan's Edge	白鳥の刃
Lucky Strike	ラッキーな一撃
Heartseeker	ハートシーカー
Last Breath	ラストブレス
Cudgel	こん棒
Spiked Cudgel	トゲ棍棒
Darkwood Branch	ダークウッドの枝
Warhammer	ウォーハンマー
Liberty Mace	自由のメイス
Morning Star	モーニングスター
Inflatable Maul	ピコピコアックス
Flanged Mace	フランジドメイス
Skull Crusher	スカルクラッシャー
Evening Star	イブニングスター
Meteor Hammer	メテオハンマー
Powder Keg	火薬樽
Whack-O'-Lantern	スマッシュ・オー・ランタン
Peppermint Mallet	ペパーミントハンマー
Tenderizer	テンダライザー
Wallace Mallet	ウォレスのハンマー
Striped Star	ストライプスター
Nautilus	ノーチラス
Opulent Maul	贅沢な斧
Mundra's Masher	ムンドラの鉄槌
Thorium Hammer	トリウムハンマー
Sunglow Impact	サングローインパクト
Gaia Maul	ガイアの斧
Javelin	ジャベリン
Hunting Spear	ハンティングスピアー
Bladed Spear	薙刀
Sturdy Pitchfork	頑丈な熊手
Ranseur	ランサー
Trishula	トリシューラ
Warlord Halberd	ウォーマスターハルバード
Spetum	スペタム
Triton Lance	トリトンランス
Cu Chulainn's Lance	クー・フーリンの槍
Royal Halberd	ロイヤルハルバード
Champion Lance	チャンピオンランス
Wyvern Glaive	ワイバーングレイブ
Hoartooth Lance	ホアトゥースランス
Luxurious Spear	豪華な槍
Stellaria	ハコベ
Longinus	ロンギヌス
Birdbane Halberd	バードベインハルバード
Titania's Gift	タイタニアのギフト
Training Bow	トレーニングボウ
Tailwind	追い風の弓
Elmwood Bow	エルムウッドボウ
Reflex Bow	リフレックスボウ
Grand Harp	大きなハープ
Compound Bow	コンパウンドボウ
Mundra's Hornbow	ムンドラの角弓
Deadeye	デッドアイ
Raptoria	ラプトリア
Quetzalcoatl	ケツァルコアトル
L'Arabesque	アラベスク
Yumi	和弓
Cupid Bow	キューピッドの弓
Bramblebane	ブランブルベイン
Maplewood Gale	メイプルウッドの疾風
Gemini Strike	ジェミニの一撃
Jolly Ranger	陽気なレンジャー
Stormrend	大嵐
Opulent Longbow	贅沢な大弓
Pinata Hunter	ピニャータハンター
Carved Branch	彫刻された杖
Sturdy Cane	丈夫な杖
Oak Staff	オーク材の杖
Owl Perch	フクロウの止まり木
Luxurious Stick	豪華な杖
Bo Staff	棒術用の杖
Apprentice Staff	見習い魔術師の杖
Jade Scepter	翡翠の笏
Amber Staff	琥珀の杖
Wizard Staff	魔法使いの杖
Staff of Seasons	季節の杖
Celestial Staff	天上の杖
Mundra's Scepter	ムンドラの王笏
Imperial Aquila	帝国のワシの杖
Phoenix Staff	フェニックスの杖
Transcendence	トランセンダンス
Tidebringer	タイドブリンガー
Zesty Scepter	刺激の笏
Seraphim	セラフィム
Staff of Merriment	陽気な杖
Penumbra	反影
Baton	バトン
Elvenwood Wand	エルフの森のワンド
Hexer's Wand	ヘクサーのワンド
Steel Rod	銅の延べ棒
Star Rod	星の延べ棒
Peppermint Cane	ペパーミントステッキ
Sylvanel	シルヴァネル
Ruby Wand	ルビーワンド
Owl Wing Wand	フクロウの翼のワンド
Wand of Midas	ミダスのワンド
Evergreen Wand	常緑樹のワンド
Equinox Rod	イクイナクスロッド
Astral Conductor	星の指揮者
Grimar's Grand Wand	グリマールの大きなワンド
Draconic Eyestalk	ドラゴンの眼柄
Light Crossbow	ライトクロスボウ
Hand Crossbow	ハンドクロスボウ
Arbalest	アルバレスト
Heavy Crossbow	ヘビークロスボウ
Cluckthrower	クラックスロー
Hunter's Crossbow	狩人のクロスボウ
Scorpio	スコルピウス
Double Crossbow	ダブルクロスボウ
Chu-Ko-Nu	連弩
Dra-Ko-Nu	ドラコヌ
Triple Crossbow	トリプルクロスボウ
Super Repeater	スーパーリピーター
Nightwing	夜の翼
Leviathan	レビヤタン
Pellet Gun	ペレット銃
Handgun	拳銃
Smoothbore	滑腔銃
Long Rifle	ロングライフル
Snowball Launcher	雪玉ランチャー
Blunderbuss	らっぱ銃
Boomstick	ショットガン
Kenora Mk. IV	ケノラMK五世
Prototype Gatling	プロトタイプガトリング
Dragonator	ドラゴネーター
Handcask '65	ハンドカスク’65
The Messenger	メッセンジャー
Oxen Impact	オックスインパクト
Omega Disintegrator	オメガディスインテグレータ
Mintyleaf Herb	ミントのハーブ
Sweet Grass	スイートグラス
Moon Powder	ムーンパウダー
Magical Mistletoe	魔法のミスルトウ
Healing Salve	回復の軟膏
Venerable Oats	由緒正しいオーツ
Silver Thistle	ギンアザミ
Bountiful Harvest	豊富な収穫
Bloodvine	ブラッドヴァイン
Fragrant Bouquet	香り高いブーケ
Mandragoroot	マンドラゴールート
Wolf's Bane	トリカブト
Mistpeak Bloom	霧峰草
Yggdrasil Branch	ユグドラシルの枝
Luckiest Clover	幸運のクローバー
Luxurious Panacea	豪華な治療薬
Wyrmblood Ointment	ウィルムブラッドの軟膏
Wild Oak Rose	野生のオークローズ
Florae Daemonica	フローレデモニカ
Bleakspire Roots	ブリークスパイアの根
Warm Tea	暖かいお茶
Healing Potion	回復ポーション
Magic Potion	魔法ポーション
Science Project	科学研究
XL Healing Potion	特大回復ポーション
Elegant Tea Set	エレガントなティーセット
XL Magic Potion	特大魔法ポーション
Old Salt's Brew	ベテラン船乗りの薬
Phoenix Tonic	フェニックストニック
Zesty Granita	辛いグラニータ
Potion of Renewal	復活のポーション
Bottled Mirth	喜びのボトル
Purple Bomb	パープルボム
Gourd Elixir	ひょうたんの霊薬
Soulfire Extract	ソウルファイア・エクストラクト
Tangy Decoction	すっぱい煎じ薬
Oak Essence	オークのエッセンス
Gaia Tonic	ガイアトニック
Midnight Oil	真夜中のオイル
Opulent Elixir	贅沢な霊薬
Distilled Nebula	蒸留された星雲
Scroll of Sparks	火花の巻物
Scroll of Cleansing	浄化の巻物
Scroll of Armor	装甲の巻物
Scroll of Storms	嵐の巻物
Song of Valor	勇気の歌
Correspondence	文書通信
Monster Manual	モンスターマニュアル
Tome of the Night	夜の書
Tome of Knowledge	知識の書
Tome of Secrets	秘密の書
Naughty or Nice List	良い子と悪い子のリスト
Bagua Board	八卦の板
Firework Bundle	花火の束
Tarot Deck	タロットデッキ
Scroll of Fortune	幸運の巻物
Grimoire Aeternum	グリモア・アエテルヌム
Imperial Decree	皇帝の判決
Luxurious Tablet	豪華な書き板
Ancestral Atlas	先祖のアトラス
Prayer Book	祈禱書
Druidic Grimoire	ドルイドのグリモア
Celestial Choir	天上の聖歌隊
Phoenix Litany	フェニックスの連祷
Tome of All-Knowledge	英知の書
Breastplate	鎧
Iron Mail	アイアンメイル
Scale Armor	スケイルアーマー
Hauberk	鎖かたびら
Knight Breastplate	騎士の胸当て
Ceremonial Breastplate	儀礼用の胸当て
Centurion Armor	センチュリオンのアーマー
Paladin Plate	パラディンプレート
Hive Guard Plate	巣の番人プレート
Samurai Do	サムライ道
Brinewater Do	深水の胴丸
Warlord Plate	ウォーマスターの鎧
General Plate	将軍プレート
Landsknecht Plate	ランツクネヒトプレート
Berserker Armor	狂戦士のアーマー
Gaia Enforcer	ガイアのエンフォーサー
Star-Spangled Plate	星条旗プレート
Juggernaut Fortress	ジャガーノートの要塞
Amber Citadel	琥珀の要塞都市
Opulent Breastplate	贅沢な胸当て
Milesian Mail	ミレトスの鎧
Celesteel Plate	セレスティール・プレート
Leather Armor	レザーアーマー
Gambeson	ギャンベゾン
Doublet	ダブレット
Studded Armor	スタッドアーマー
Blizzard Armor	ブリザードアーマー
Hide Armor	ハイドアーマー
Mundra's Tabard	ムンドラのタバード
Savage Garb	サヴェージガーブ
Glade Guard Armor	森の守り手の鎧
Pumpkin Armor	パンプキンアーマー
Ninja Garb	忍者ガーブ
Night Armor	夜の鎧
Windrunner Armor	ウィンドランナーアーマー
Drakeskin Armor	ドレイクスキンアーマー
Smith Attire	鍛冶屋の衣装
Corsair Mantle	コルセアのマント
Swan's Garment	白鳥の衣服
Cloudwalker Armor	雲行く者のアーマー
Everdusk Lord Attire	エバーダスク貴族の衣装
Opulent Armor	贅沢なアーマー
Shirt	シャツ
Black Robe	黒のローブ
Druid's Robe	ドルイドのローブ
Disciple's Robe	使徒のローブ
Scholar's Tunic	学者のチュニック
Explorer's Outfit	探検者の衣装
Tailor Mantle	仕立て屋のマント
Witch's Outfit	魔女の衣装
Vestal Raiments	純潔の服
Wizard Attire	魔法使いの衣装
Midnight Apparel	真夜中の服装
Shaman Vestment	シャーマンの祭服
Luxurious Attire	豪華な衣装
Astravestimenta	アストラベスティメンタ
Ostara Vest	オスタラベスト
Desert Threads	砂漠の糸筋
Archmage Raiments	アークマジックの衣装
Republic Garments	共和国の衣装
Djinn Robes	ジンのローブ
Sturdy Cap	丈夫な帽子
Warrior Helmet	戦士のヘルメット
Horned Helm	角兜
Raider Helm	レイダーヘルム
Knight Heaume	騎士の兜
Brinewater Helm	深水の兜
Eagle Helm	イーグルヘルム
Paladin Helm	パラディンヘルム
Kodiak Helmet	ゴディアックのヘルメット
Samurai Kabuto	サムライのかぶと
Gladiator Helm	グラディエーターヘルム
General Heaume	将軍の大兜
Crusader Helmet	クルセイダーヘルメット
Warlord Helmet	ウォーマスターの兜
Berserker Helmet	狂戦士のヘルメット
Centurion Helmet	センチュリオンのヘルメット
Juggernaut Furnace	ジャガーノートのかまど
Gobble Lord Helm	貪欲な貴族の兜
Opulent Heaume	贅沢な大兜
Celesteel Heaume	セレスティールの兜
Leather Cap	レザーキャップ
Canopy Cap	キャノピーキャップ
Brimmed Hat	つば付き帽
Feathered Hat	羽根帽子
Tricorn	三角帽子
Silk Hood	シルクのフード
Santa's Elf Hat	サンタの小人の帽子
Pirate Hat	海賊の帽子
Lovely Hat	ラブリーな帽子
Night Cowl	夜のフード
Nomad Veil	遊牧民のベール
Harvester's Hood	収穫用のフード
Windrunner Hat	ウィンドランナーの帽子
Drakeskin Mask	ドレイクの仮面
Storm Dragon Mask	ストームドラゴンの仮面
Grand Tyrolean	グランドチロリアン
Corsair Tricorn	コルセアの三角帽
Republic Coiffe	共和国コイフ
Everdusk Cowl	エバーダスクのフード
Abyssal Hood	深淵のフード
Rogue Sombrero	ローグのソンブレロ
Stitched Cone	ステッチされたコーン
Black Cowl	黒のフード
Druid Laurels	ドルイドの月桂樹
Apprentice Tiara	見習い魔術師のティアラ
Bronze Circlet	ブロンズのサークレット
Wizard Hat	魔法使いの帽子
Hat of the Four Winds	4つ風の帽子
Ostara Hat	オスタラハット
Witch Hat	魔女帽子
Owl Cowl	フクロウのフード
Tactician Hat	戦術家の帽子
Summoner Hat	召喚術師の帽子
Shaman Hat	シャーマンの帽子
Luxurious Headdress	豪華なヘッドドレス
Astral Hat	星の帽子
Raven Mask	レイヴンの仮面
Spellward Hat	魔除けの帽子
Opal Diadem	オパールの王冠
Night Crown	夜の王冠
Djinn Veil	ジンのベール
Elegant Top Hat	エレガントな帽子
Iron Armguards	鉄のアームガード
Plated Gauntlets	プレートガントレット
Warrior Gauntlets	戦士のガントレット
Demi Gauntlets	デミ・ガントレット
Pumpkin Gauntlets	パンプキンガントレット
Knight Gauntlets	騎士のガントレット
Paladin Gauntlets	パラディンのガントレット
Sungrasp Gauntlets	サングラスプ・ガントレット
Landsknecht Gauntlets	ランツクネヒトガントレット
Samurai Kote	サムライのこて
Republic Gauntlets	共和国ガントレット
General Gauntlets	将軍のガントレット
Berserker Gauntlets	狂戦士のガントレット
Luxurious Gauntlets	豪華なガントレット
Juggernaut Grip	ジャガーノートのグリップ
Winter's Touch	ウィンタータッチ
Celesteel Gauntlets	セレスティール・ガントレット
Gaia's Hold	ガイアの一握り
Leather Gloves	革の手袋
Bracers	ブレイサー
Thief's Gloves	盗賊の手袋
Swift Mitts	迅速のミット
Patchleather Bracers	つぎはぎ革のブレイサー
Studded Gloves	スタッドグローブ
Elven Vambraces	エルフの腕甲
Ostara Gloves	オスタラグローブ
Savage Claws	サヴェージクロー
Black Wyrm Claws	ブラックワームの爪
Ninja Gloves	忍者の手袋
Windrunner Gloves	ウィンドランナーの手袋
Drakeskin Gloves	ドレイクスキンの手袋
Mountain Man Mitts	山男の手袋
Corsair Gloves	コルセアの手袋
Fortunate Gloves	幸運の手袋
Opulent Grasp	贅沢な手袋
Everdusk Gloves	エバーダスクの手袋
Raptor Wings	猛禽類の翼
Shin Guards	すね当て
Long Boots	ロングブーツ
Iron Greaves	鉄のすね当て
Hero's Boots	ヒーローのブーツ
Reinforced Greaves	強化すね当て
Knight Sollerets	騎士の鉄靴
Cindersole	燃えがらのブーツ
Paladin Boots	パラディンの靴
Samurai Haidate	サムライのはいだて
General Greaves	将軍のすね当て
Berserker Stompers	狂戦士の厚底靴
Luxurious Boots	豪華なブーツ
Vanguard Greaves	先駆者のすね当て
Juggernaut Greaves	ジャガーノートのすね当て
Bunbun Booties	バンバンブーティーズ
Celesteel Boots	セレスティール・ブーツ
Leather Boots	レザーブーツ
Trailblazers	トレイルブレイザー
Flip-Flops	ビーチサンダル
Soft Shoes	ソフトシューズ
Legionnaire Sandals	軍団兵のサンダル
Thief's Shoes	シーフの靴
Perennial Sandals	とこしえのサンダル
Elven Shoes	エルフの靴
Savage Stride	サヴェージストライド
Sultan Steps	サルタンの靴
Ninja Tabi	忍者の足袋
Windrunner Boots	ウィンドランナーのブーツ
Alpine Stride	アルペンストライダー
Drakeskin Boots	ドレイクスキンのブーツ
Plaguewalkers	プレイグウォーカー
Shoes of Style	流行のシューズ
Corsair Boots	コルセアのブーツ
Cloudwalker Steps	雲行く者の靴
Everdusk Boots	エバーダスクのブーツ
Raptor Talons	猛禽類の爪
Wooden Shield	木の盾
Heavy Buckler	ヘビーバックラー
Oaken Shield	オーク材の盾
Iron Shield	鉄の盾
Aurum Ward	黄金の防護
Teardrop Shield	ティアドロップシールド
Imperial Scutum	インペリアル大型盾
Champion Vigil	チャンピオンの夜警
Mythril Aspis	ミスリルアスビス
Gaia Aegis	ガイアイージス
Wyrmguard	ウィルムガード
Ancestor Totem	先祖のトーテム
Angelic Pavise	エンジェルパヴィース
Prometheon	プロメシオン
Milesian Shield	ミトレスの盾
Bunbun Buckler	バンバンバックラー
Luxurious Aegis	豪華なイージス
Goldmane Guard	ゴールドメインの守護兵
Emperor Wyrmguard	皇帝のウィルムガード
Bearded Paragon	あごひげを生やしたパラゴン
Honeycomb Defender	ハニカムの防衛者
Iron Ring	鉄リング
Alloy Loop	合金の輪
Ruby Ring	ルビーリング
Emerald Ring	エメラルドリング
Silver Band	シルバーバンド
Ring of Passion	ハートの指輪
Noble Ring	ノーブルリング
Ring of Rhythm	リズムの指輪
Knight Signet	騎士のシグネット
Batrachite Stone	バトラカイトストーン
Soulstone Ring	ソウルストーンリング
Ring of the Chosen	選ばれし者の指輪
Brimstone Coil	硫黄のらせん
Fairfolk Band	フェアリーバンド
Dawnflower Ring	ドーンフラワーの指輪
Valedictorian Ring	卒業生代表の指輪
Luxurious Signet	豪華なシグネット
Borealis	ボレアリス
Northwind Gem	北風のジェム
Blizzard Ring	ブリザードリング
Bunbun Band	バンバンバンド
Rubicon Prison	ルビコンプリズン
Memento	メメント
Jade Pendant	翡翠ペンダント
Iron Bond	アイアンボンド
Mundra's Amulet	ムンドラのアミュレット
Sun Pendant	サンペンダント
Eclipse Amulet	蝕のアミュレット
Medal of Honor	名誉のメダル
Noble Chain	ノーブルチェーン
Lucky Medallion	幸運のメダリオン
Luxurious Charm	豪華なお守り
Holy Symbol	聖なるシンボル
Convenient Pendant	便利なペンダント
Titanium Torc	チタントルク
Magical Timepiece	魔法のタイムピース
Magatama Necklace	勾玉のネックレス
Dragonsoul Pendant	ドラゴンソウルのペンダント
Archivist Glasses	アーキビストのゴーグル
Stygian Phylactery	地獄のお守り
Ursa Totem	ウルサトーテム
Alimyriad	アリミリャド
Freyja's Talisman	フレイヤのお守り
VIP Talisman	VIPのお守り
Brísingamen	ブリーシンガメン
Monsoon Heart	モンスーンの床（ハート模様）
Chipped Runestone	欠けた石
Flawed Runestone	不完全な石
Chiseled Runestone	加工された石
Lesser Moonstone	低級ムーンストーン
Superior Moonstone	上級ムーンストーン
Greater Moonstone	特上級ムーンストーン
Ember Element	燃えさしのエレメント
Flame Element	火のエレメント
Blaze Element	火炎のエレメント
Bubble Element	水疱のエレメント
Tide Element	潮のエレメント
Flood Element	氾濫のエレメント
Breeze Element	そよ風のエレメント
Gale Element	強風のエレメント
Tempest Element	嵐のエレメント
Nature Element	自然のエレメント
Wild Element	野生のエレメント
Primal Element	獣性のエレメント
Light Element	光のエレメント
Holy Element	聖なるエレメント
Sacred Element	神聖なエレメント
Corrupted Element	汚染のエレメント
Unholy Element	不浄のエレメント
Nightmare Element	悪夢のエレメント
Ram Spirit	牡山羊の精霊
Wolf Spirit	狼の精霊
Ox Spirit	雄牛の精霊
Eagle Spirit	ワシの精霊
Viper Spirit	毒蛇の精霊
Cat Spirit	猫の精霊
Rhino Spirit	サイの精霊
Owl Spirit	フクロウの精霊
Armadillo Spirit	アルマジロの精霊
Lizard Spirit	トカゲの精霊
Horse Spirit	馬の精霊
Hippo Spirit	カバの精霊
Shark Spirit	サメの精霊
Walrus Spirit	セイウチの精霊
Lion Spirit	獅子の精霊
Bear Spirit	クマの精霊
Mammoth Spirit	マンモスの精霊
Dinosaur Spirit	恐竜の精霊
Barkback's Armor	バーバックのアーマー
Jester Jouster	ジェスタージョスター
Primitech Slingshot	原始的なスリングショット
Opulent Sallet	贅沢なサレット
Plated Squeakers	プレートスクイーカー
Star-Spangled Greaves	星条旗のすね当て
Seltzer Surprise	セルツァーサプライズ
Sealed Declaration	封印された宣言
Forlorn Acorn	悲しみのどんぐり
Troublin Bludgeon	トラブリンのこん棒
Twicicle Javelin	ツインアイスジャベリン
Opulent Wand	豪華なワンド
Ice Queen's Scepter	氷の女王の王笏
Cat Burglar Outfit	ネコ泥棒の衣装
Cat Burglar Hood	ネコ泥棒のフード
Cat Burglar Claws	ネコ泥棒の爪
Aurora Springwater	オーロラの湧き水
Ring of Liberty	自由の指輪
Chocolicious Blade	チョコ大好きブレード
Super Snack Pack	スーパースナックパック
Crunchy Bracelet	サクサクなブレスレット
Dogbone Blaster	ドッグボーン・ブラスター
Canid Helmet	イヌのヘルメット
Canid Paws	イヌの肉球
Canid Plate	イヌのプレート
Tsukuyomi	ツクヨミ
Moonlight Wand	月光のワンド
Moonlight Kimono	月光の着物
Moonlight Z将ﾗri	月光の草履
Br将ｿsingamen	ブリーシンガメン
`;
