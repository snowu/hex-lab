import ast,json,pathlib
root=pathlib.Path(__file__).resolve().parents[2];out={}
def lit(x):return json.dumps(x,ensure_ascii=False) if isinstance(x,str) else ('true' if x is True else 'false' if x is False else str(x))
for slug in ['isbn-verifier','point-mutations','hexadecimal','octal','trinary','line-up','affine-cipher','resistor-color-expert','rectangles','ocr-numbers','poker','killer-sudoku-helper']:
 d=json.loads((root/'content/katas/python'/f'{slug}.json').read_text());tests=[]
 for meth in [x for x in ast.walk(ast.parse(d['tests'])) if isinstance(x,ast.FunctionDef) and x.name.startswith('test_')]:
  env={}
  for node in meth.body:
   if isinstance(node,ast.Assign):
    try:env[node.targets[0].id]=ast.literal_eval(node.value)
    except:pass
   if not isinstance(node,ast.Expr) or not isinstance(node.value,ast.Call):continue
   a=node.value
   if not isinstance(a.func,ast.Attribute) or a.func.attr not in ['assertEqual','assertIs']:continue
   if len(a.args)!=2 or not isinstance(a.args[0],ast.Call):continue
   c=a.args[0]
   def val(x):return env[x.id] if isinstance(x,ast.Name) else ast.literal_eval(x)
   try:args=[val(x) for x in c.args];expected=val(a.args[1]);fun=c.func.id
   except:continue
   t=''
   if slug in ['isbn-verifier','point-mutations','hexadecimal','octal','trinary']:
    f={'isbn-verifier':'is_valid','point-mutations':'hamming_distance'}.get(slug,'to_decimal');t=f'assert({f}('+','.join(map(lit,args))+')=='+lit(expected)+');'
   elif slug=='line-up':t='{char actual[1000];line_up('+','.join(map(lit,args))+',actual,sizeof actual);assert(!strcmp(actual,'+lit(expected)+'));}'
   elif slug=='affine-cipher':t='{char actual[1000];assert('+fun+'('+','.join(map(lit,args))+',actual));assert(!strcmp(actual,'+lit(expected)+'));}'
   elif slug in ['resistor-color-expert','rectangles','ocr-numbers','poker']:
    array=args[0];t='{const char*values[]={'+','.join(map(lit,array))+('NULL' if not array else '')+'};'
    if slug=='resistor-color-expert':t+='char actual[1000];assert(resistor_label(values,'+str(len(array))+',actual,sizeof actual));assert(!strcmp(actual,'+lit(expected)+'));}'
    elif slug=='rectangles':t+=f'assert(count_rectangles(values,{len(array)})=={expected});}}'
    elif slug=='ocr-numbers':t+=f'char actual[1000];assert(convert(values,{len(array)},actual));assert(!strcmp(actual,'+lit(expected)+'));}'
    else:
     indices=[i for i,v in enumerate(array) if v in expected];t+=f'size_t actual[100];assert(best_hands(values,{len(array)},actual)=={len(indices)});'+''.join(f'assert(actual[{j}]=={i});' for j,i in enumerate(indices))+'}'
   elif slug=='killer-sudoku-helper':
    target,size,ex=args;mask=sum(1<<(i-1) for i in ex);t='{unsigned actual[512];assert(combinations('+f'{target},{size},{mask},actual)=={len(expected)});'+''.join(f'assert(actual[{i}]=={sum(1<<(x-1) for x in v)});' for i,v in enumerate(expected))+'}'
   if t:tests.append(t)
 out[slug]='\n'.join(tests)
 print(slug,len(tests))
(root/'scripts/native/ports-c-canonical.json').write_text(json.dumps(out,ensure_ascii=False))
for slug in ['house','twelve-days','bottle-song','food-chain','transpose','book-store','change','game-of-life']:
 d=json.loads((root/'content/katas/python'/f'{slug}.json').read_text());tests=[]
 for meth in [x for x in ast.walk(ast.parse(d['tests'])) if isinstance(x,ast.FunctionDef) and x.name.startswith('test_')]:
  env={}
  for node in meth.body:
   if isinstance(node,ast.Assign):
    try:env[node.targets[0].id]=ast.literal_eval(node.value)
    except:pass
   if not isinstance(node,ast.Expr) or not isinstance(node.value,ast.Call):continue
   a=node.value
   if not isinstance(a.func,ast.Attribute) or a.func.attr!='assertEqual' or len(a.args)!=2 or not isinstance(a.args[0],ast.Call):continue
   c=a.args[0]
   def val(x):return env[x.id] if isinstance(x,ast.Name) else ast.literal_eval(x)
   try:args=[val(x) for x in c.args];expected=val(a.args[1]);fun=c.func.id
   except:continue
   t=''
   if slug in ['house','twelve-days','bottle-song','food-chain','transpose']:
    f='transpose' if slug=='transpose' else 'recite'
    if slug=='bottle-song':
     kw={k.arg:val(k.value) for k in c.keywords}
     args=[args[0] if args else kw['start'], args[1] if len(args)>1 else kw.get('take',1)]
    if isinstance(expected,list):expected='\n'.join(expected)
    t='{char*actual='+f+'('+','.join(map(lit,args))+');assert(!strcmp(actual,'+lit(expected)+'));free(actual);}'
   elif slug=='book-store':
    values=args[0];t='{unsigned values[]={'+','.join(map(str,values))+('0' if not values else '')+'};assert(fabs(total(values,'+str(len(values))+')-'+lit(expected)+')<1e-9);}'
   elif slug=='change':
    values,target=args;t='{int values[]={'+','.join(map(str,values))+('0' if not values else '')+'},actual[100];assert(find_fewest_coins(values,'+str(len(values))+','+str(target)+',actual)=='+str(len(expected))+');'+''.join(f'assert(actual[{i}]=={v});' for i,v in enumerate(expected))+'}'
   elif slug=='game-of-life':
    board=args[0];rows=len(board);cols=len(board[0]) if rows else 0;values=[x for r in board for x in r];wanted=[x for r in expected for x in r];t='{unsigned char values[]={'+','.join(map(str,values))+('0' if not values else '')+'},actual[1000];tick(values,'+f'{rows},{cols},actual);'+''.join(f'assert(actual[{i}]=={v});' for i,v in enumerate(wanted))+'}'
   if t:tests.append(t)
 out[slug]='\n'.join(tests);print(slug,len(tests))
(root/'scripts/native/ports-c-canonical.json').write_text(json.dumps(out,ensure_ascii=False))
for slug in ['ledger','markdown','tournament','forth','state-of-tic-tac-toe','bowling']:
 d=json.loads((root/'content/katas/python'/f'{slug}.json').read_text());tests=[]
 for meth in [x for x in ast.walk(ast.parse(d['tests'])) if isinstance(x,ast.FunctionDef) and x.name.startswith('test_')]:
  env={}
  def val(x):
   if isinstance(x,ast.Name):return env[x.id]
   if isinstance(x,ast.Call) and isinstance(x.func,ast.Attribute) and x.func.attr=='join':return val(x.func.value).join(val(x.args[0]))
   if isinstance(x,ast.Call) and isinstance(x.func,ast.Name) and x.func.id=='create_entry':return tuple(val(a) for a in x.args)
   if isinstance(x,ast.List):return [val(a) for a in x.elts]
   return ast.literal_eval(x)
  for node in meth.body:
   if isinstance(node,ast.Assign):
    try:env[node.targets[0].id]=val(node.value)
    except:pass
   if not isinstance(node,ast.Expr) or not isinstance(node.value,ast.Call):continue
   a=node.value
   if not isinstance(a.func,ast.Attribute) or a.func.attr!='assertEqual' or len(a.args)!=2 or not isinstance(a.args[0],ast.Call):continue
   c=a.args[0]
   try:args=[val(x) for x in c.args];expected=val(a.args[1])
   except:continue
   t=''
   if slug=='ledger':
    currency,locale,entries=args;items=[]
    for date,desc,amount in entries:
     y,m,d=map(int,date.split('-'));items.append('{'+f'{y},{m},{d},'+lit(desc)+','+str(amount)+'}')
    t='{entry values[]={'+','.join(items)+('{0,0,0,NULL,0}' if not items else '')+'};char*actual=format_entries('+lit(currency)+','+lit(locale)+',values,'+str(len(items))+');assert(!strcmp(actual,'+lit(expected)+'));free(actual);}'
   elif slug=='markdown':t='{char*actual=parse('+lit(args[0])+');assert(!strcmp(actual,'+lit(expected)+'));free(actual);}'
   elif slug=='tournament':
    values=args[0];t='{const char*values[]={'+','.join(map(lit,values))+('NULL' if not values else '')+'};char*actual=tally(values,'+str(len(values))+');assert(!strcmp(actual,'+lit('\n'.join(expected))+'));free(actual);}'
   elif slug=='forth':
    values=args[0];t='{const char*values[]={'+','.join(map(lit,values))+('NULL' if not values else '')+'};int*actual;size_t n;assert(evaluate(values,'+str(len(values))+',&actual,&n)==FORTH_OK&&n=='+str(len(expected))+');'+''.join(f'assert(actual[{i}]=={v});' for i,v in enumerate(expected))+'free(actual);}'
   elif slug=='state-of-tic-tac-toe':
    values=args[0];t='{const char*values[]={'+','.join(map(lit,values))+'};assert(state(values)=='+{'win':'WIN','draw':'DRAW','ongoing':'ONGOING'}[expected]+');}'
   elif slug=='bowling' and 'rolls' in env:
    values=env['rolls'];t='{bowling g={{0},0};int actual;int rolls[]={'+','.join(map(str,values))+('0' if not values else '')+'};for(size_t i=0;i<'+str(len(values))+';i++)assert(roll(&g,rolls[i]));assert(score(&g,&actual)&&actual=='+str(expected)+');}'
   if t:tests.append(t)
 out[slug]='\n'.join(tests);print(slug,len(tests))
(root/'scripts/native/ports-c-canonical.json').write_text(json.dumps(out,ensure_ascii=False))
import re
slug='swift-scheduling';d=json.loads((root/'content/katas/python'/f'{slug}.json').read_text());tests=[]
for x in ast.walk(ast.parse(d['tests'])):
 if not isinstance(x,ast.Call) or not isinstance(x.func,ast.Attribute) or x.func.attr!='assertEqual':continue
 try:c=x.args[0];start,desc=[ast.literal_eval(a) for a in c.args];expected=ast.literal_eval(x.args[1])
 except:continue
 parts=[int(v) for v in re.findall(r'\d+',start)];wanted=[int(v) for v in re.findall(r'\d+',expected)];fields=['year','month','day','hour','minute','second']
 tests.append('{date_time start={'+','.join(map(str,parts))+'},actual;assert(delivery_date(start,'+lit(desc)+',&actual));'+''.join(f'assert(actual.{field}=={v});' for field,v in zip(fields,wanted))+'}')
out[slug]='\n'.join(tests);print(slug,len(tests))
(root/'scripts/native/ports-c-canonical.json').write_text(json.dumps(out,ensure_ascii=False))
