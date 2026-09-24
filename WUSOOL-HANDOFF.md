# وثيقة تسليم مشروع وصول (وصول)

## 1. الغرض من الوثيقة

هذه الوثيقة تسلّم مشروع **وصول** إلى مطور أو شخص آخر يستطيع متابعة العمل من النقطة الحالية دون إعادة تحليل المشروع من البداية. تحتوي الوثيقة على وصف الوظائف، وبنية الملفات، وقاعدة البيانات، وآلية الدخول والمزامنة، والتعديلات البصرية الأخيرة، وأوامر التشغيل، والأكواد الأساسية التي يجب معرفتها قبل أي تعديل.

> **الحالة الحالية:** المشروع يعمل كتطبيق ويب كامل باستخدام React وVite وExpress وtRPC وDrizzle وقاعدة بيانات MySQL/TiDB. آخر نقطة محفوظة هي `30e97c21`.

## 2. النتيجة الحالية

الموقع يتكون من واجهتين رئيسيتين. الواجهة الأولى عامة للطلاب، ولا تحتاج إلى تسجيل دخول. الواجهة الثانية خاصة بالإدارة، وتحميها جلسة خادم. عندما يضيف المدير واجبًا أو درسًا أو حصة، تُحفظ البيانات في قاعدة البيانات المشتركة، ثم تظهر للطلاب من الأجهزة المختلفة.

التصميم الحالي مستوحى من التصميم رقم 01 الذي اعتمد لوحة كحلية داكنة مع لمسات خضراء وبطاقات للجدول والمواد والواجبات. أضيف أيضًا وضع فاتح، مع حفظ تفضيل الوضع على الجهاز نفسه.

## 3. الوظائف المنفذة

### صفحة الطالب

تحتوي صفحة الطالب على شاشة بداية تطلب اسم الطالب في أول زيارة. يُحفظ الاسم في `localStorage` على الجهاز نفسه، ولذلك لا يُطلب الاسم في كل زيارة من الجهاز ذاته. الاسم ليس بيانات مزامنة بين الأجهزة؛ فكل جهاز يحتفظ باسم المستخدم الخاص به.

بعد الدخول تعرض الصفحة اسم الطالب، والجدول اليومي من الأحد إلى الخميس، والمواد الدراسية، وعدد الدروس والواجبات لكل مادة، وتفاصيل الدروس، والواجبات مع حساب الأيام المتبقية، وتلوين حالة الواجب. كما تعرض التنبيهات للواجبات القريبة أو المتأخرة.

تتضمن الصفحة بحثًا عن المواد، واختيار يوم الجدول، وتصفية الواجبات حسب الحالة، وتحديد نطاق زمني قبل تصدير التقرير، وتصدير صفحة الطالب إلى PDF عبر نافذة الطباعة، وفتح مرفقات الواجبات.

### صفحة الإدارة

صفحة الإدارة محمية برقم الدخول ورمز الدخول التاليين:

```text
رقم الدخول: 5055
رمز الدخول: 0099
```

تسمح الصفحة بإضافة مادة، وواجب، ودرس، وحصة في الجدول. تسمح كذلك بتعديل وحذف المواد والدروس والواجبات والحصص. يوجد تأكيد قبل الحذف، وإحصائيات لعدد المواد والدروس والواجبات، ورفع مرفق للواجب بحد أقصى 8 ميجابايت.

صفحة الإدارة متجاوبة مع الجوال والتابلت والكمبيوتر. في الجوال تُعرض الإحصائيات عموديًا، وتتحول التبويبات إلى شريط قابل للتمرير، وتصبح الحقول والأزرار أكبر لتناسب اللمس.

عند مغادرة صفحة الإدارة فعليًا أو إغلاقها تُرسل عملية تسجيل الخروج، ولذلك يُطلب الدخول من جديد عند فتح الإدارة. لا يُنفذ القفل عند مجرد تغيير تركيز المتصفح أو تبديل التبويب؛ حتى لا تتعطل عملية الدخول.

### الوضع الداكن والفاتح

يوجد زر في صفحة الطالب وصفحة الإدارة وصفحة تسجيل الدخول للتبديل بين الوضعين. يحفظ الاختيار في المتصفح باستخدام المفتاح:

```text
wusool-theme
```

تمت إضافة قواعد تباين صريحة للنصوص والحقول في الوضعين. حقل رمز الإدارة يعرض النص الذي يكتبه المدير مباشرة، بدل إخفائه بنقاط، حسب الطلب الحالي.

## 4. المزامنة وقاعدة البيانات

المزامنة بين الأجهزة تعتمد على قاعدة البيانات الموجودة في الخادم، وليست على `localStorage`. لذلك يجب تشغيل الموقع الكامل أو نشره على خادم يدعم قاعدة البيانات. إذا فتح شخص ملفات HTML مباشرة من مدير الملفات فلن يحصل على مزامنة قاعدة البيانات.

البيانات التي تُزامن بين الأجهزة هي المواد والدروس والواجبات والجدول. أما اسم الطالب والوضع الداكن أو الفاتح فهما إعدادان محليان لكل جهاز.

### الجداول الحالية

| الجدول | الغرض |
|---|---|
| `users` | حسابات الإدارة والمستخدمين، وتتضمن اسم المستخدم والرمز المشفر والدور. |
| `subjects` | المواد الدراسية واللون والترتيب. |
| `lessons` | الدروس المرتبطة بالمواد. |
| `assignments` | الواجبات وموعد التسليم والوصف والمرفق. |
| `schedule` | حصص الجدول اليومية وأوقاتها وموادها. |

العلاقات الحالية تعتمد على `subjectId` داخل الدروس والواجبات والجدول. حذف المادة يحذف المحتوى المرتبط بها من خلال منطق الخادم.

## 5. بنية المشروع

```text
school-portal-prototype/
├── client/
│   ├── index.html
│   ├── public/
│   │   └── vanilla/                 # نسخة HTML/CSS/JS احتياطية وليست الواجهة الأساسية
│   └── src/
│       ├── pages/
│       │   └── Portal.tsx           # صفحة الطالب وصفحة الإدارة في ملف واحد
│       ├── components/              # مكونات الواجهة المشتركة
│       ├── contexts/
│       ├── hooks/
│       ├── lib/trpc.ts
│       ├── App.tsx                  # المسارات / و /manage
│       ├── main.tsx
│       └── index.css                # الهوية البصرية والتباين والاستجابة
├── drizzle/
│   ├── schema.ts                    # مخطط قاعدة البيانات
│   └── migrations/
├── server/
│   ├── db.ts                        # عمليات القراءة والكتابة
│   ├── routers.ts                   # إجراءات tRPC والصلاحيات
│   ├── school-auth.ts               # جلسة دخول الإدارة وتشفير الرمز
│   └── _core/                       # طبقة الخادم الأساسية
├── shared/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 6. الملفات التي يجب قراءتها أولًا

يبدأ المطور الجديد بهذه الملفات بالترتيب:

1. `client/src/pages/Portal.tsx` لفهم واجهتي الطالب والإدارة.
2. `client/src/index.css` لفهم الألوان والوضعين الداكن والفاتح والاستجابة.
3. `server/routers.ts` لمعرفة إجراءات القراءة والإضافة والتعديل والحذف والصلاحيات.
4. `server/db.ts` لمعرفة عمليات قاعدة البيانات.
5. `drizzle/schema.ts` لمعرفة الجداول والحقول.
6. `client/src/App.tsx` لمعرفة المسارات.
7. `package.json` لمعرفة أوامر التشغيل والبناء والاختبار.

## 7. الأكواد المهمة الحالية

### مسارات التطبيق

المساران الرئيسيان في `client/src/App.tsx` هما:

```tsx
<Switch>
  <Route path="/" component={StudentPortal} />
  <Route path="/manage" component={AssignmentEntry} />
  <Route path="/404" component={NotFound} />
  <Route component={NotFound} />
</Switch>
```

### حفظ اسم الطالب على الجهاز

الكود الحالي داخل `StudentPortal` يستخدم المفتاح التالي:

```tsx
const [studentName, setStudentName] = useState(
  () => localStorage.getItem("wusool-student-name") || "",
);

const saveName = (event: React.FormEvent) => {
  event.preventDefault();
  const value = nameDraft.trim();
  if (value.length < 2) return;
  localStorage.setItem("wusool-student-name", value);
  setStudentName(value);
  setNameDraft("");
};

const changeName = () => {
  setNameDraft(studentName);
  setStudentName("");
  localStorage.removeItem("wusool-student-name");
};
```

### حفظ الوضع الداكن والفاتح

يستخدم الطالب والإدارة المفتاح نفسه حتى يحافظ المتصفح على الاختيار:

```tsx
const [lightMode, setLightMode] = useState(
  () => localStorage.getItem("wusool-theme") === "light",
);

const toggleTheme = () => {
  const next = !lightMode;
  setLightMode(next);
  localStorage.setItem("wusool-theme", next ? "light" : "dark");
};
```

وتُضاف الفئة إلى العنصر الرئيسي:

```tsx
<main className={`wusool-admin ${lightMode ? "light-mode" : ""}`}>
```

أو في صفحة الطالب:

```tsx
<main className={`wusool-design01 ${lightMode ? "light-mode" : ""}`}>
```

### إظهار رمز الإدارة أثناء الكتابة

حقل الرمز في `LoginGate` أصبح نصيًا حتى يظهر ما يكتبه المدير مباشرة:

```tsx
<input
  required
  type="text"
  inputMode="numeric"
  autoComplete="off"
  className={inputClass}
  value={code}
  onChange={event => setCode(event.target.value)}
  placeholder="اكتب رمز الدخول"
/>
```

إذا أراد المطور إخفاء الرمز مستقبلًا، يعيد `type="password"`، لكن ذلك يخالف الاختيار الحالي للمستخدم.

### قفل صفحة الإدارة عند المغادرة

الكود الحالي يقفل الجلسة عند مغادرة الصفحة فعليًا باستخدام حدث `pagehide` فقط:

```tsx
useEffect(() => {
  const lockOnLeave = () => {
    const body = JSON.stringify({ "0": { json: null } });
    navigator.sendBeacon(
      "/api/trpc/auth.schoolLogout?batch=1",
      new Blob([body], { type: "application/json" }),
    );
  };

  window.addEventListener("pagehide", lockOnLeave);
  return () => window.removeEventListener("pagehide", lockOnLeave);
}, []);
```

تم حذف `visibilitychange` و`beforeunload` من القفل؛ لأنهما قد يُنفذان عند تبديل التبويب أو فقدان التركيز ويقطعان عملية الدخول.

### دخول الإدارة

إجراء الدخول في الواجهة يستدعي الإجراء التالي:

```tsx
schoolLogin.mutate({
  username,
  password: code,
});
```

ويتحقق الخادم من المستخدم والرمز ثم يضع جلسة في Cookie. حماية عمليات الإدارة في الخادم مبنية على الإجراء `schoolManagerProcedure`، ولا يكفي إخفاء رابط الإدارة من الواجهة للوصول الآمن.

### حماية عمليات الإدارة في الخادم

النمط الأساسي في `server/routers.ts` هو:

```ts
const schoolManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "manager" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذه العملية متاحة لمدير المدرسة فقط",
    });
  }
  return next({ ctx });
});
```

الإجراءات الحساسة تستخدم هذا الإجراء، مثل:

```ts
createLesson: schoolManagerProcedure
  .input(lessonInput)
  .mutation(({ input }) => createLesson(input)),

createAssignment: schoolManagerProcedure
  .input(assignmentInput)
  .mutation(({ input }) => createAssignment(input)),

createScheduleItem: schoolManagerProcedure
  .input(scheduleInput)
  .mutation(({ input }) => createScheduleItem(input)),
```

كما توجد إجراءات التعديل والحذف للمواد والدروس والواجبات والحصص.

### حساب الأيام المتبقية

حساب الأيام يعتمد على تاريخ الجهاز المحلي، ويعرض الحالات التالية:

```tsx
function daysLabel(date: string) {
  const days = daysLeft(date);
  if (days === 0) return "التسليم اليوم";
  if (days > 0) return `متبقي ${days} ${days === 1 ? "يوم" : "أيام"}`;
  const late = Math.abs(days);
  return `متأخر ${late} ${late === 1 ? "يوم" : "أيام"}`;
}
```

## 8. إجراءات tRPC المهمة

الإجراء العام لقراءة محتوى الطلاب هو:

```text
school.content
```

إجراءات الدخول والخروج هي:

```text
auth.schoolLogin
auth.schoolLogout
auth.me
```

إجراءات الإدارة تشمل:

```text
school.createSubject
school.updateSubject
school.deleteSubject
school.createLesson
school.updateLesson
school.deleteLesson
school.createAssignment
school.updateAssignment
school.deleteAssignment
school.createScheduleItem
school.updateScheduleItem
school.deleteScheduleItem
```

جميع عمليات الإضافة والتعديل والحذف يجب أن تمر من `server/routers.ts`. لا تضف اتصالًا مباشرًا من المتصفح إلى قاعدة البيانات.

## 9. تشغيل المشروع محليًا

يتطلب التشغيل وجود Node.js وpnpm وبيانات البيئة الخاصة بقاعدة البيانات. بعد تنزيل المشروع:

```bash
cd school-portal-prototype
pnpm install
pnpm db:push
pnpm dev
```

يفتح الخادم التطويري عادة على المنفذ 3000. للتأكد من سلامة المشروع قبل النشر:

```bash
pnpm check
pnpm test
pnpm build
```

لتشغيل نسخة الإنتاج بعد البناء:

```bash
pnpm start
```

لا تُنشئ ملف `.env` من التخمين. يجب استخدام متغيرات البيئة الصحيحة الخاصة بالمشروع، مثل `DATABASE_URL` و`JWT_SECRET` ومتغيرات الخادم الأخرى.

## 10. الاختبارات الحالية

الاختبارات الموجودة حاليًا هي:

```text
server/auth.logout.test.ts
server/school-auth.test.ts
server/school-authz.test.ts
```

آخر تحقق نجح بالنتيجة التالية:

```text
Test Files  3 passed
Tests       4 passed
TypeScript  passed
Build       passed
```

يظهر تحذير من Vite حول حجم بعض حزم JavaScript الأكبر من 500 كيلوبايت. هذا تحذير تحسين أداء وليس خطأ بناء، ولا يمنع التشغيل.

## 11. ما يجب عدم تغييره دون فهم

لا تُحذف `server/_core`؛ فهي تحتوي طبقة الخادم الأساسية. لا تُنقل عمليات قاعدة البيانات إلى المتصفح. لا تستخدم `localStorage` لمحتوى الواجبات إذا كان المطلوب مزامنة بين الأجهزة؛ استخدم إجراءات tRPC وقاعدة البيانات.

لا تُرجع `visibilitychange` إلى منطق القفل؛ لأنه قد يسجل خروج المدير عند تبديل التطبيق على الجوال. استخدم `pagehide` أو زر الخروج في التنقل الداخلي.

إذا أُضيف حقل جديد إلى قاعدة البيانات، يجب تعديل `drizzle/schema.ts` ثم إنشاء migration وتطبيقها على قاعدة البيانات قبل الاعتماد على الحقل في الواجهة.

## 12. اقتراحات المتابعة

الخطوة التالية المناسبة هي إضافة إعدادات المدرسة، مثل اسم المدرسة والشعار، من داخل صفحة الإدارة بدل تركها ثابتة في الكود. بعد ذلك يمكن إضافة مهلة اختيارية لقفل الإدارة بعد عدم الاستخدام، مع تحذير قبل انتهاء الجلسة. ويمكن أيضًا إضافة اختبارات واجهة آلية لمسار الدخول وتبديل الوضعين وإضافة واجب.

## 13. التسليم والنسخة الحالية

يمكن فتح النسخة الحالية من نقطة الحفظ التالية:

[فتح آخر نسخة من موقع وصول](manus-webdev://30e97c21)

الملفات الأساسية في نسخة المشروع:

- `client/src/pages/Portal.tsx`
- `client/src/index.css`
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `client/src/App.tsx`
- `package.json`

## المراجع

[1]: https://react.dev/ "React Documentation"
[2]: https://vite.dev/ "Vite Documentation"
[3]: https://orm.drizzle.team/docs/overview "Drizzle ORM Documentation"
[4]: https://trpc.io/docs "tRPC Documentation"
[5]: https://www.typescriptlang.org/docs/ "TypeScript Documentation"
