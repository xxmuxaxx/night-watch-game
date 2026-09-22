// array hero face image

let heroFacesArray = [
	'img/hero-1.jpg', 'img/hero-2.jpg', 'img/hero-3.jpg',
	'img/hero-4.jpg', 'img/hero-5.jpg', 'img/hero-6.jpg'
]

//  Create our Hero

let hero = {}

//  Классы героя. Ключ совпадает с id радиокнопки в меню создания героя.
//  crit — шанс двойного урона, dodge — шанс увернуться от удара врага
let heroClasses = {
	Warrior: { title: 'Воин',      hp: 10, strength: 2, crit: 0,   dodge: 0 },
	Rogue:   { title: 'Разбойник', hp: 8,  strength: 1, crit: 0.3, dodge: 0.25 }
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