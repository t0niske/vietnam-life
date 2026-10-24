function makeDemo(now){
  now=now||new Date();
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const mkey=(y,m)=>{const d=new Date(y,m,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
  const Y=now.getFullYear(),M=now.getMonth(),today=now.getDate();
  let n=0;const id=p=>p+(++n).toString(36);
  // expenses: current month exactly as in the mockup, earlier months similar
  const base={'Аренда':16900000,'Питание':8700000,'Кафе и рестораны':5800000,'Транспорт':3400000,'Путешествия':7200000,'Коммуналка':2400000,'Другое':3850000};
  const notes={'Аренда':['Аренда квартиры'],'Питание':['Супермаркет Lotte','Рынок Чо Дам','WinMart','Фрукты'],'Кафе и рестораны':['Фо Бо','Кофе','Ужин у моря','Бань ми'],'Транспорт':['Grab','Аренда байка','Бензин'],'Путешествия':['Билеты в Дананг','Отель в Дананге'],'Коммуналка':['Коммуналка за месяц'],'Другое':['Аптека','Стрижка','Подарки']};
  const mult=[1,1.12,1.06,1.034,1.107,0.976]; // current, -1, -2 ...
  const expenses=[];
  mult.forEach((k,back)=>{
    const lastDay=back===0?Math.max(1,today):new Date(Y,M-back+1,0).getDate();
    Object.entries(base).forEach(([cat,sum],ci)=>{
      const parts=cat==='Аренда'||cat==='Коммуналка'?1:(cat==='Путешествия'?2:notes[cat].length);
      let total=Math.round(sum*(back===0?1:k*(0.9+((ci*37+back*11)%20)/100))/10000)*10000;
      let left=total;
      for(let p=0;p<parts;p++){
        const amt=p===parts-1?left:Math.round(total/parts*(0.8+((p*13+ci)%5)/10)/10000)*10000;
        left-=amt;
        const day=cat==='Аренда'?1:1+((p*7+ci*5+back*3)%lastDay);
        expenses.push({id:id('e'),date:iso(new Date(Y,M-back,day)),cat,amount:amt,note:notes[cat][p%notes[cat].length],acc:'acc_vnd'});
      }
    });
  });
  const utilities=[[1750000,700000],[2650000,1300000],[2450000,1150000],[2600000,1250000],[2400000,1100000]].map((u,i)=>{
    const back=4-i, el=u[1], rest=u[0]-el;
    return {id:id('u'),month:mkey(Y,M-back),electricity:el,water:back?Math.round(rest*.25/1000)*1000:320000,internet:250000,garbage:120000,service:back?rest-Math.round(rest*.25/1000)*1000-370000:610000,kwh:Math.round(el/3000)};
  });
  const apartments=[
    {id:id('a'),city:'Нячанг',name:'Mường Thanh',price:12000000,rooms:2,area:55,view:'Вид на море',from:mkey(Y,M-4)+'-01',to:'',current:true,img:'apt_main',deposit:12000000,note:'Бассейн на крыше, 5 минут до пляжа'},
    {id:id('a'),city:'Дананг',name:'An Thượng',price:9500000,rooms:1,area:40,view:'Вид на город',from:mkey(Y,M-11)+'-01',to:mkey(Y,M-5)+'-28',current:false,img:'apt2',deposit:9500000,note:'Рядом пляж Ми Кхе'},
    {id:id('a'),city:'Хошимин',name:'Thảo Điền, D2',price:14000000,rooms:2,area:62,view:'Вид на реку',from:mkey(Y,M-15)+'-01',to:mkey(Y,M-12)+'-28',current:false,img:'apt3',deposit:14000000,note:'Шумно, но много кафе'}
  ];
  const goals=[
    {id:id('g'),title:'Финансовая подушка',saved:1200,target:5000,color:'#2f9e5b',icon:'shield',featured:false},
    {id:id('g'),title:'Путешествие на Бали',saved:500,target:1500,color:'#e8484a',icon:'mountain',featured:true},
    {id:id('g'),title:'Новая камера',saved:300,target:800,color:'#f5a63c',icon:'camera',featured:false},
    {id:id('g'),title:'Курс вьетнамского',saved:50,target:300,color:'#e8484a',icon:'book',featured:false}
  ];
  const t1=addD(now,3);
  const events=[
    {id:id('v'),date:iso(t1),from:'08:00',to:'09:00',title:'Йога',type:'sport',done:false},
    {id:id('v'),date:iso(addD(now,4)),from:'10:00',to:'14:00',title:'Работа',type:'work',done:false},
    {id:id('v'),date:iso(addD(now,5)),from:'07:40',to:'09:20',title:'Вылет в Дананг',type:'flight',done:false},
    {id:id('v'),date:iso(addD(now,6)),from:'',to:'',title:'Бана Хиллс',type:'sight',done:true},
    {id:id('v'),date:iso(addD(now,7)),from:'',to:'',title:'Пляж и отдых',type:'beach',done:false},
    {id:id('v'),date:iso(addD(now,12)),from:'19:00',to:'21:00',title:'Ужин с друзьями',type:'other',done:false}
  ];
  const trips=[
    {id:id('t'),city:'Дананг',from:iso(addD(now,5)),to:iso(addD(now,11)),img:'trip1',budget:7200000,checklist:[{t:'Купить билеты',d:true},{t:'Забронировать отель',d:true},{t:'Составить маршрут',d:true},{t:'Оформить страховку',d:false}],note:'Бана Хиллс, Мраморные горы, Хойан'},
    {id:id('t'),city:'Фукуок',from:mkey(Y,M+1)+'-14',to:mkey(Y,M+1)+'-20',img:'trip2',budget:15000000,checklist:[{t:'Купить билеты',d:false},{t:'Забронировать отель',d:false}],note:'Закат на Sunset Town'},
    {id:id('t'),city:'Ханой',from:mkey(Y,M+2)+'-05',to:mkey(Y,M+2)+'-10',img:'trip3',budget:10000000,checklist:[{t:'Купить билеты',d:false}],note:'Халонг на 2 дня'}
  ];
  const D=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const plan=[
    [['Овсянка с манго','и чиа'],['Бо с говядиной',''],['Курица с рисом','и овощами'],['Смузи боул','']],
    [['Яйца и тосты','с авокадо'],['Фо га','с курицей'],['Рыба на пару','с рисом'],['Йогурт','с бананом']],
    [['Сырники','с ягодами'],['Бун ча','с зеленью'],['Тофу','с овощами вок'],['Кокос','и орехи']],
    [['Овсянка','с ягодами'],['Ком танг','с курицей'],['Креветки','с брокколи'],['Смузи манго','']],
    [['Омлет','с овощами'],['Салат с говядиной','и рисом'],['Гои куон','спринг-роллы'],['Фрукты','драгонфрут']],
    [['Банх куон','рисовые блинчики'],['Морепродукты','на гриле'],['Лаб с курицей','и салатом'],['Чай','и орехи']],
    [['Панкейки','с бананом'],['Фо бо','с говядиной'],['Суп канх','с рыбой'],['Смузи боул','']]
  ];
  const meals={days:D.map((d,i)=>({day:d,items:plan[i].map((m,j)=>({name:m[0],desc:m[1],kcal:[380,520,560,240][j]}))}))};
  const notesList=[
    {id:id('n'),text:'Продлить визу (до '+iso(addD(now,18)).slice(8)+'.'+iso(addD(now,18)).slice(5,7)+')',done:true},
    {id:id('n'),text:'Найти новую квартиру на следующий месяц',done:true},
    {id:id('n'),text:'Проверить страховку',done:false},
    {id:id('n'),text:'Купить переходник',done:false},
    {id:id('n'),text:'Забронировать байк в Дананге',done:true}
  ];
  const health=[
    {id:id('h'),date:iso(addD(now,-20)),kind:'Страховка',title:'Медстраховка на год',cost:4800000,note:'Полис до конца следующего года'},
    {id:id('h'),date:iso(addD(now,-45)),kind:'Врач',title:'Стоматолог, чистка',cost:900000,note:''},
    {id:id('h'),date:iso(addD(now,9)),kind:'Врач',title:'Плановый осмотр',cost:0,note:'Взять результаты анализов'}
  ];
  const useful={
    sim:'Viettel, Mobifone и Vinaphone продают туристические SIM и eSIM. Для долгого проживания удобнее оформить SIM на паспорт в официальном офисе оператора.',
    transport:'Grab и Be для такси и байк-такси. Байк в аренду — посуточно или помесячно, нужны права категории A.',
    visa:'E-visa до 90 дней оформляется онлайн на официальном портале. Следить за датой выезда!',
    medicine:'Международные клиники в крупных городах. Аптеки (Nhà thuốc) на каждом шагу. Номер скорой: 115.',
    banks:'Карту местного банка удобно иметь для QR-оплаты. Банкоматы с низкой комиссией: Vietcombank, TPBank.',
    shopping:'Рынки — торговаться можно. Супермаркеты: Lotte Mart, WinMart, Co.opmart.',
    hacks:'Пить только бутилированную воду. Носить с собой мелкие купюры. В сезон дождей — дождевик под сиденьем байка.',
    services:'Доставка еды: GrabFood, ShopeeFood. Прачечная (giặt ủi) оплачивается за кг.'
  };
  const settings={name:'',city:'Нячанг',temp:32,feels:36,rate:25000,rates:{RUB:290,KZT:50},budget:70000000,kwhPrice:3000,quote:'«Больше жизни, меньше суеты»'};
  // salary in rubles, changed to tenge and then to dong every month
  const accounts=[{id:'acc_rub',name:'Тинькофф',cur:'RUB',start:120000},{id:'acc_kzt',name:'Kaspi',cur:'KZT',start:0},{id:'acc_vnd',name:'Наличные',cur:'VND',start:3000000}];
  const incomes=[],transfers=[];
  for(let back=5;back>=0;back--){
    const d=n=>iso(new Date(Y,M-back,n));
    incomes.push({id:id('i'),date:d(5),amount:250000,cur:'RUB',vnd:250000*290,rate:290,source:'Зарплата',acc:'acc_rub'});
    if(back%2===0)incomes.push({id:id('i'),date:d(18),amount:3000000,cur:'VND',vnd:3000000,rate:1,source:'Фриланс',acc:'acc_vnd'});
    transfers.push({id:id('x'),date:d(7),from:'acc_rub',out:200000,to:'acc_kzt',in:1080000,fee:2000,feeCur:'RUB',feeAcc:'acc_rub',note:''});
    transfers.push({id:id('x'),date:d(8),from:'acc_kzt',out:1050000,to:'acc_vnd',in:52500000,fee:0,feeCur:'',feeAcc:'',note:''});
  }
  // a weighing every two or three days for two months, slowly going down
  const weights=[];
  for(let back=60,k=82.4;back>=1;back-=2+(back%3===0?1:0)){k=Math.round((k-0.12+((back*7)%5-2)*0.08)*10)/10;weights.push({id:id('w'),date:iso(new Date(Y,M,today-back)),kg:k,note:back===60?'Начало':''})}
  settings.weightGoal=75;
  return {expenses,incomes,accounts,transfers,weights,utilities,apartments,goals,events,trips,meals,notes:notesList,health,useful,settings};
}
if(typeof module!=='undefined')module.exports=makeDemo;
