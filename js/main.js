// array hero face image

let heroFacesArray = [
	'img/hero-1.jpg', 'img/hero-2.jpg', 'img/hero-3.jpg',
	'img/hero-4.jpg', 'img/hero-5.jpg', 'img/hero-6.jpg'
]

//  Create our Hero

let hero = {}

//  Характеристики для проверок (check в пунктах меню). strength ещё и прибавляется к урону в бою
let statNames = {
	strength: 'Сила',
	agility:  'Ловкость',
	wits:     'Чутьё'
}

//  Классы героя. Ключ совпадает с id радиокнопки в меню создания героя.
//  strength, agility, wits — характеристики (см. statNames)
//  crit — шанс двойного урона, dodge — шанс увернуться от удара врага
//  special — приём класса в бою: name, description, cooldown (сколько ходов ждать после использования)
//  и эффекты: damage — множитель урона, stun — враг пропускает ответный удар, crit — гарантированный точный удар
let heroClasses = {
	Warrior: { title: 'Воин',      hp: 10, strength: 2, agility: 1, wits: 1, crit: 0,   dodge: 0,
	           description: 'Крепкий и сильный. Бьёт стабильно и держит удар.',
	           special: { name: 'Мощный удар', description: 'двойной урон, враг пропускает ответный удар',
	                      cooldown: 3, damage: 2, stun: true } },
	Rogue:   { title: 'Разбойник', hp: 8,  strength: 1, agility: 3, wits: 2, crit: 0.3, dodge: 0.25,
	           description: 'Хрупкий, но ловкий: бьёт точно и уходит от ударов.',
	           special: { name: 'Подлый удар', description: 'гарантированный точный удар',
	                      cooldown: 2, crit: true } }
}


// локации --- массив

let locations = [];



// конструктор нпс

var npc = function (_name, _class, _index) {
	this.name = _name;
	this.class = _class;
	this.strength = 0;
	this.img = _index;
	this.hp = 0;
	this.currentHp = 0;
	this.weapon = {
		name: 'none',
		damage: 2
	}

	switch (this.class) {
		case 'Воин':
			this.hp = 12;
			this.currentHp = this.hp;
			break;
	//	case 'rogue':
	//		this.hp = 10;
	//		this.currentHp = this.hp;
	//		break;
		default:
			this.null;
	}

	this.sayHi = function() {
		alert('привет, меня зовут - ' + this.name)
	};

	

}

// Массив с лицами

let faceArr = ['img/portrait-mentor.jpg']