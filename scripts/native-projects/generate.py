# Generate original native terminal project bundles; verify real games/tests before writing.
import pathlib,json,subprocess,tempfile,os
root=pathlib.Path(__file__).resolve().parents[2]; Z=os.environ.get('ZIG','zig')
grid=['#########','#P..#..G#','#.#.#...#','#.#...#.#','#..C.C..#','#########']
projects=[]
license='MIT License\n\nCopyright (c) 2026 Game Dev Lab\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n'
def emit(pid,lang,starter,solution,model,main,tests,explanation,metadata):
 if lang=='zig':
  def formatted(text):
   with tempfile.TemporaryDirectory() as td:
    p=pathlib.Path(td)/'source.zig';p.write_text(text);r=subprocess.run([Z,'fmt',str(p)],capture_output=True,text=True)
    if r.returncode:raise Exception(r.stderr)
    return p.read_text()
  starter,solution,model,main,tests=map(formatted,[starter,solution,model,main,tests])
 ext={'c':'c','cpp':'cpp','zig':'zig'}[lang];header='model.'+('h' if lang=='c' else 'hpp' if lang=='cpp' else 'zig');fn='mechanics.'+ext;test='tests.'+ext;mainfn='main.'+ext
 build=['zig','build-exe',mainfn,'-lc','-femit-bin=game'] if lang=='zig' else ['cc' if lang=='c' else 'c++','-std=c17' if lang=='c' else '-std=c++20',fn,mainfn,'-o','game']
 testcmd=['zig','test',test] if lang=='zig' else ['cc' if lang=='c' else 'c++','-std=c17' if lang=='c' else '-std=c++20',fn,test,'-o','project-tests']
 config=dict(sourceNames=[fn],testNames=[test],supportNames=[header,mainfn],testEntry=test,executable='project-tests')
 if lang!='zig':config['compileNames']=[fn,test]
 files={header:model,mainfn:main,test:tests,'LICENSE':license}
 bundle=dict(id=pid,version=1,language=lang,learnerFiles=[fn],starter={fn:starter},solution={fn:solution},files=files,commands=dict(build=' '.join(build),test=' '.join(testcmd)+('' if lang=='zig' else ' && ./project-tests'),play='./game',replay='./game --replay '+metadata['winningReplay']+' > replay.ndjson'),packageConfig=config,explanation=explanation)
 readme=f"# {metadata['title']} ({lang})\n\n{metadata['prompt']}\n\nEdit `{fn}`. `{header}` defines the fixed-size state; it owns its arrays, and callbacks borrow a mutable pointer/reference to it. No heap-owned gameplay buffers are returned. The main program calls your mechanics for every input; it does not implement a second version of the game.\n\nBuild: `{bundle['commands']['build']}`\nPlay: `./game` (press Enter after each action; q exits).\nTests: `{bundle['commands']['test']}`\nReplay: `{bundle['commands']['replay']}`\n\nReplay files contain a header followed by native-computed JSON frames. Import replay.ndjson on the project page; its viewer displays those frames without simulating movement, cooldowns or enemies.\n\nRequirements: {'Zig 0.17.0 and a system C library (-lc)' if lang=='zig' else 'a C17 compiler' if lang=='c' else 'a C++20 compiler'}. Windows: executable names may end in .exe; use game.exe/project-tests.exe instead of ./game/./project-tests.\n\nThe starter compiles and deliberately fails named tests. Implement the mechanics, run tests, then play and export your own replay. The reference and explanation stay on the website; the starter download does not replace your work with the solution.\n"
 bundle['files']['README.md']=readme
 with tempfile.TemporaryDirectory() as td:
  p=pathlib.Path(td)
  for name,text in files.items():(p/name).write_text(text)
  for part,source in [('solution',solution),('starter',starter)]:
   (p/fn).write_text(source)
   cmd=[Z]+testcmd[1:] if lang=='zig' else testcmd
   r=subprocess.run(cmd,cwd=td,capture_output=True,text=True)
   if lang!='zig' and r.returncode==0:r=subprocess.run([str(p/'project-tests')],cwd=td,capture_output=True,text=True)
   if part=='solution' and r.returncode:raise Exception(pid+'/'+lang+' reference tests\n'+r.stderr)
   if part=='starter' and (r.returncode==0 or (lang=='zig' and 'failed.' not in r.stderr)):raise Exception(pid+'/'+lang+' starter\n'+r.stderr)
   r=subprocess.run(([Z]+build[1:] if lang=='zig' else build),cwd=td,capture_output=True,text=True)
   if r.returncode:raise Exception(pid+'/'+lang+' playable build\n'+r.stderr)
   r=subprocess.run([str(p/'game'),'--replay',metadata['winningReplay']],cwd=td,capture_output=True,text=True)
   if r.returncode:raise Exception(pid+'/'+lang+' replay\n'+r.stderr)
   frames=[json.loads(line) for line in r.stdout.splitlines()]
   if part=='solution' and not frames[-1]['won']:raise Exception(pid+'/'+lang+' reference replay did not win '+r.stdout)
   if part=='starter' and frames[-1]['won']:raise Exception(pid+'/'+lang+' starter replay unexpectedly won')
  print(pid,lang,flush=True)
 (root/'content/native-projects'/f'{pid}-{lang}.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
runner_meta=dict(id='tile-runner',title='Tile Runner: movement, collision and pickups',blurb='Implement the movement callback, collect both coins and reach the exit in a native terminal game.',difficulty='starter',minutes=35,lesson='gd-collision',kind='runner',grid=grid,winningReplay='sssddddddwww',prompt='Implement can_enter and runner_step. w/a/s/d move one cell; walls and out-of-bounds destinations block movement. Collect each C only once (coins is a two-bit mask: (3,4)=bit 0, (5,4)=bit 1). Reaching G at (7,1) wins only after both pickups. Each input increments ticks and records whether movement succeeded; an already-won game remains unchanged. The terminal executable calls your functions for every action. First make the collision test fail visibly, then repair the mechanics, play a winning route and export its native frames.')
runner_model='''#ifndef MODEL_H
#define MODEL_H
#include <stdbool.h>
#define WIDTH 9
#define HEIGHT 6
static const char *const board[HEIGHT]={"#########","#P..#..G#","#.#.#...#","#.#...#.#","#..C.C..#","#########"};
/* Runner owns its scalar state. The board is immutable and borrowed. */
typedef struct {int x,y;unsigned coins;bool won;unsigned ticks;bool moved;} Runner;
static inline Runner runner_initial(void) {Runner s={1,1,0,false,0,false};return s;}
bool can_enter(const Runner *state,int x,int y);
void runner_step(Runner *state,char action);
#endif
'''
runner_solution='''#include "model.h"
bool can_enter(const Runner *state,int x,int y) {
    (void)state;
    return x>=0 && y>=0 && x<WIDTH && y<HEIGHT && board[y][x]!='#';
}
void runner_step(Runner *state,char action) {
    if(state->won)return;
    state->ticks++;state->moved=false;
    int dx=action=='d'?1:action=='a'?-1:0;
    int dy=action=='s'?1:action=='w'?-1:0;
    if((dx==0&&dy==0)||!can_enter(state,state->x+dx,state->y+dy))return;
    state->x+=dx;state->y+=dy;state->moved=true;
    if(state->y==4 && state->x==3)state->coins|=1u;
    if(state->y==4 && state->x==5)state->coins|=2u;
    state->won=state->x==7 && state->y==1 && state->coins==3;
}
'''
runner_starter='''#include "model.h"
/* Broken movement: it ignores walls and never records pickups or a win. */
bool can_enter(const Runner *state,int x,int y) {(void)state;return x>=0&&y>=0&&x<WIDTH&&y<HEIGHT;}
void runner_step(Runner *state,char action) {
    if(state->won)return;state->ticks++;state->moved=false;
    int dx=action=='d'?1:action=='a'?-1:0,dy=action=='s'?1:action=='w'?-1:0;
    if((dx||dy)&&can_enter(state,state->x+dx,state->y+dy)){state->x+=dx;state->y+=dy;state->moved=true;}
}
'''
runner_main='''#include "model.h"
#include <stdio.h>
#include <string.h>
static void frame(const Runner *s,char action) {printf("{\\"type\\":\\"frame\\",\\"tick\\":%u,\\"action\\":\\"%c\\",\\"x\\":%d,\\"y\\":%d,\\"coins\\":%u,\\"won\\":%s,\\"moved\\":%s}\\n",s->ticks,action,s->x,s->y,s->coins,s->won?"true":"false",s->moved?"true":"false");}
static void draw(const Runner *s) {
    puts("\\nTile Runner: w/a/s/d + Enter; q quits. @ is you, C is a coin, G is the exit.");
    for(int y=0;y<HEIGHT;y++){for(int x=0;x<WIDTH;x++){char cell=board[y][x];if(cell=='P')cell='.';if(y==4&&x==3&&(s->coins&1))cell='.';if(y==4&&x==5&&(s->coins&2))cell='.';if(s->x==x&&s->y==y)cell='@';putchar(cell);}putchar('\\n');}
    printf("Coins %u/2 | tick %u | %s\\n",(s->coins&1?1u:0u)+(s->coins&2?1u:0u),s->ticks,s->won?"YOU WIN":s->moved?"Moved":"Wall or wait");
}
int main(int argc,char **argv) {
    Runner s=runner_initial();
    if(argc==3&&strcmp(argv[1],"--replay")==0){puts("{\\"type\\":\\"header\\",\\"project\\":\\"tile-runner\\",\\"version\\":1,\\"language\\":\\"LANGUAGE\\"}");frame(&s,'.');for(const char *p=argv[2];*p&&!s.won;p++){if(!strchr("wasd.",*p)){fputs("Replay actions must use w/a/s/d/.\\n",stderr);return 2;}runner_step(&s,*p);frame(&s,*p);}return 0;}
    if(argc!=1){fputs("Usage: game [--replay ACTIONS]\\n",stderr);return 2;}
    draw(&s);int action;
    while(!s.won&&(action=getchar())!=EOF){if(action=='q')break;if(!strchr("wasd.",action))continue;runner_step(&s,(char)action);draw(&s);}return 0;
}
'''
runner_tests='''#include "model.h"
#include <stdio.h>
#define CHECK(condition,name) do {if(!(condition)){fprintf(stderr,"FAIL %s\\n",name);return 1;}printf("PASS %s\\n",name);}while(0)
int main(void) {
    Runner s=runner_initial();
    CHECK(!can_enter(&s,0,1)&&!can_enter(&s,-1,1)&&!can_enter(&s,WIDTH,1),"walls and bounds reject movement");
    runner_step(&s,'d');CHECK(s.x==2&&s.y==1&&s.moved&&s.ticks==1,"walk to adjacent floor");
    runner_step(&s,'d');runner_step(&s,'d');CHECK(s.x==3&&s.y==1&&!s.moved,"wall blocks the player");
    unsigned tick=s.ticks;runner_step(&s,'.');CHECK(s.x==3&&s.ticks==tick+1&&!s.moved,"wait records a native tick without movement");
    s=runner_initial();s.x=2;s.y=4;runner_step(&s,'d');CHECK(s.coins==1,"first pickup sets only its bit");runner_step(&s,'a');runner_step(&s,'d');CHECK(s.coins==1,"revisiting a pickup never duplicates it");
    s.x=7;s.y=2;runner_step(&s,'w');CHECK(!s.won,"exit requires both coins");
    s=runner_initial();const char *route="sssddddddwww";while(*route)runner_step(&s,*route++);CHECK(s.won&&s.coins==3&&s.x==7&&s.y==1,"real level has a playable winning route");
    tick=s.ticks;runner_step(&s,'s');CHECK(s.won&&s.ticks==tick&&s.y==1,"won state does not move again");
    puts("Named movement/collision/pickup scenarios complete.");return 0;
}
'''
runner_explanation='can_enter validates bounds before indexing the borrowed immutable board. runner_step maps one action to a cardinal offset, records the tick, and commits position only when can_enter allows the destination. Pickup bits make repeated visits idempotent. The exit check uses the resulting native state; entering G without both bits cannot win. main calls this callback for both interactive input and replay export, so changing collision/pickup code changes the game and exported frames.'
for lang in ['c','cpp']:
 header='model.h' if lang=='c' else 'model.hpp'
 emit('tile-runner',lang,runner_starter.replace('model.h',header),runner_solution.replace('model.h',header),runner_model,runner_main.replace('model.h',header).replace('LANGUAGE',lang),runner_tests.replace('model.h',header),runner_explanation,runner_meta)
runner_zmodel='''pub const width=9;pub const height=6;
pub const board=[_] []const u8{"#########","#P..#..G#","#.#.#...#","#.#...#.#","#..C.C..#","#########"};
// All state is owned by value; board rows are borrowed immutable literals.
pub const Runner=struct{x:i32=1,y:i32=1,coins:u32=0,won:bool=false,ticks:u32=0,moved:bool=false};
pub fn runner_initial() Runner{return .{};}
'''
runner_zsolution='''const m=@import("model.zig");
pub fn can_enter(state:*const m.Runner,x:i32,y:i32) bool {_=state;return x>=0 and y>=0 and x<m.width and y<m.height and m.board[@intCast(y)][@intCast(x)]!='#';}
pub fn runner_step(state:*m.Runner,action:u8) void {
    if(state.won)return;state.ticks+=1;state.moved=false;
    const dx:i32=if(action=='d') 1 else if(action=='a') -1 else 0;
    const dy:i32=if(action=='s') 1 else if(action=='w') -1 else 0;
    if((dx==0 and dy==0) or !can_enter(state,state.x+dx,state.y+dy))return;
    state.x+=dx;state.y+=dy;state.moved=true;
    if(state.y==4 and state.x==3)state.coins|=1;
    if(state.y==4 and state.x==5)state.coins|=2;
    state.won=state.x==7 and state.y==1 and state.coins==3;
}
'''
runner_zstarter='''const m=@import("model.zig");
// Broken movement: ignores walls, pickups and the exit.
pub fn can_enter(state:*const m.Runner,x:i32,y:i32) bool{_=state;return x>=0 and y>=0 and x<m.width and y<m.height;}
pub fn runner_step(state:*m.Runner,action:u8) void{if(state.won)return;state.ticks+=1;state.moved=false;const dx:i32=if(action=='d') 1 else if(action=='a') -1 else 0;const dy:i32=if(action=='s') 1 else if(action=='w') -1 else 0;if((dx!=0 or dy!=0) and can_enter(state,state.x+dx,state.y+dy)){state.x+=dx;state.y+=dy;state.moved=true;}}
'''
runner_zmain='''const std=@import("std");const m=@import("model.zig");const learner=@import("mechanics.zig");
extern "c" fn printf(format:[*:0]const u8,...) c_int;extern "c" fn getchar() c_int;extern "c" fn putchar(c_int) c_int;extern "c" fn puts([*:0]const u8) c_int;extern "c" fn exit(c_int) noreturn;
fn truth(b:bool) [*:0]const u8{return if(b) "true" else "false";}
fn frame(s:m.Runner,action:u8) void {_=printf("{\\"type\\":\\"frame\\",\\"tick\\":%u,\\"action\\":\\"%c\\",\\"x\\":%d,\\"y\\":%d,\\"coins\\":%u,\\"won\\":%s,\\"moved\\":%s}\\n",@as(c_uint,s.ticks),@as(c_int,action),@as(c_int,s.x),@as(c_int,s.y),@as(c_uint,s.coins),truth(s.won),truth(s.moved));}
fn draw(s:m.Runner) void {
    _=puts("\\nTile Runner: w/a/s/d + Enter; q quits. @ is you, C is a coin, G is the exit.");
    for(m.board,0..) |row,y| {for(row,0..) |original,x| {var cell=original;if(cell=='P')cell='.';if(y==4 and x==3 and s.coins&1!=0)cell='.';if(y==4 and x==5 and s.coins&2!=0)cell='.';if(s.x==x and s.y==y)cell='@';_=putchar(@as(c_int,cell));}_=putchar(10);}
    const count=@as(c_uint,@intFromBool(s.coins&1!=0))+@as(c_uint,@intFromBool(s.coins&2!=0));_=printf("Coins %u/2 | tick %u | %s\\n",count,@as(c_uint,s.ticks),@as([*:0]const u8,if(s.won) "YOU WIN" else if(s.moved) "Moved" else "Wall or wait"));
}
pub fn main(init:std.process.Init) !void {
    const args=try init.minimal.args.toSlice(init.arena.allocator());var s=m.runner_initial();
    if(args.len==3 and std.mem.eql(u8,args[1],"--replay")){_=puts("{\\"type\\":\\"header\\",\\"project\\":\\"tile-runner\\",\\"version\\":1,\\"language\\":\\"zig\\"}");frame(s,'.');for(args[2]) |action| {if(s.won)break;if(std.mem.indexOfScalar(u8,"wasd.",action)==null){_=puts("Replay actions must use w/a/s/d/.");exit(2);}learner.runner_step(&s,action);frame(s,action);}return;}
    if(args.len!=1){_=puts("Usage: game [--replay ACTIONS]");exit(2);}draw(s);while(!s.won){const input=getchar();if(input<0 or input=='q')break;if(input>255)continue;const action:u8=@intCast(input);if(std.mem.indexOfScalar(u8,"wasd.",action)==null)continue;learner.runner_step(&s,action);draw(s);}
}
'''
runner_ztests='''const std=@import("std");const t=std.testing;const m=@import("model.zig");const learner=@import("mechanics.zig");
test "walls and bounds reject movement" {const s=m.runner_initial();try t.expect(!learner.can_enter(&s,0,1));try t.expect(!learner.can_enter(&s,-1,1));try t.expect(!learner.can_enter(&s,m.width,1));}
test "walk to adjacent floor" {var s=m.runner_initial();learner.runner_step(&s,'d');try t.expect(s.x==2 and s.y==1 and s.moved and s.ticks==1);}
test "wall blocks the player" {var s=m.runner_initial();for("ddd") |a|learner.runner_step(&s,a);try t.expect(s.x==3 and s.y==1 and !s.moved);}
test "wait records a native tick without movement" {var s=m.runner_initial();learner.runner_step(&s,'.');try t.expect(s.ticks==1 and !s.moved and s.x==1);}
test "pickups are collected only once" {var s=m.runner_initial();s.x=2;s.y=4;learner.runner_step(&s,'d');try t.expect(s.coins==1);learner.runner_step(&s,'a');learner.runner_step(&s,'d');try t.expect(s.coins==1);}
test "exit requires both coins" {var s=m.runner_initial();s.x=7;s.y=2;learner.runner_step(&s,'w');try t.expect(!s.won);}
test "real level has a playable winning route" {var s=m.runner_initial();for("sssddddddwww") |a|learner.runner_step(&s,a);try t.expect(s.won and s.coins==3 and s.x==7 and s.y==1);}
test "won state does not move again" {var s=m.runner_initial();for("sssddddddwww") |a|learner.runner_step(&s,a);const tick=s.ticks;learner.runner_step(&s,'s');try t.expect(s.won and s.ticks==tick and s.y==1);}
'''
emit('tile-runner','zig',runner_zstarter,runner_zsolution,runner_zmodel,runner_zmain,runner_ztests,runner_explanation,runner_meta)
arena_meta=dict(id='wave-arena',title='Wave Arena: firing cooldowns and scheduled enemies',blurb='Build a native turn-based survival game: enforce fire timing, spawn waves and advance enemies.',difficulty='intermediate',minutes=50,lesson='gd-loop',kind='arena',width=9,height=5,winningReplay='....faa.fddddf',prompt='Implement arena_step: a/d move horizontally (clamped to columns 0..8), f fires, and . waits. Every action is one fixed simulation tick (250 ms). First reduce a positive cooldown by one; fire only when it is zero, then set it to 3. A shot removes the nearest enemy in the player column and awards one point. Next move surviving enemies down one row; reaching row 4 costs one health and removes the enemy. Increment tick, then spawn at ticks 4,8,12,... in columns 4,2,6 repeating, at row 0. Win at three points while alive; zero health loses. Finished state stays unchanged. The terminal game and replay producer both call your callback.')
arena_model='''#ifndef MODEL_H
#define MODEL_H
#include <stdbool.h>
#define WIDTH 9
#define HEIGHT 5
#define MAX_ENEMIES 8
typedef struct {int x,y;} Enemy;
/* Arena owns its fixed-capacity enemy storage. The callback borrows this state. */
typedef struct {int player,health;unsigned tick,cooldown,waves,score,count;bool fired,hit,won;Enemy enemies[MAX_ENEMIES];} Arena;
static inline Arena arena_initial(void) {Arena s={0};s.player=4;s.health=3;return s;}
void arena_step(Arena *state,char action);
#endif
'''
arena_solution='''#include "model.h"
static void remove_enemy(Arena *s,unsigned i) {for(unsigned j=i+1;j<s->count;j++)s->enemies[j-1]=s->enemies[j];s->count--;}
void arena_step(Arena *s,char action) {
    if(s->won||s->health<=0)return;
    s->fired=false;s->hit=false;
    if(action=='a'&&s->player>0)s->player--;
    if(action=='d'&&s->player<WIDTH-1)s->player++;
    if(s->cooldown>0)s->cooldown--;
    if(action=='f'&&s->cooldown==0) {
        s->fired=true;s->cooldown=3;int target=-1;
        for(unsigned i=0;i<s->count;i++)if(s->enemies[i].x==s->player&&(target<0||s->enemies[i].y>s->enemies[target].y))target=(int)i;
        if(target>=0){remove_enemy(s,(unsigned)target);s->score++;s->hit=true;}
    }
    unsigned i=0;
    while(i<s->count){s->enemies[i].y++;if(s->enemies[i].y>=HEIGHT-1){remove_enemy(s,i);if(s->health>0)s->health--;}else i++;}
    s->tick++;
    if(s->health>0&&s->score<3&&s->tick%4==0&&s->count<MAX_ENEMIES){const int columns[3]={4,2,6};Enemy enemy={columns[s->waves%3],0};s->enemies[s->count++]=enemy;s->waves++;}
    s->won=s->health>0&&s->score>=3;
}
'''
arena_starter='''#include "model.h"
/* Broken: firing is always ready, no enemies spawn or move, so the game cannot be won. */
void arena_step(Arena *s,char action) {
    if(s->won||s->health<=0)return;
    if(action=='a'&&s->player>0)s->player--;
    if(action=='d'&&s->player<WIDTH-1)s->player++;
    s->cooldown=0;s->fired=action=='f';s->hit=false;s->tick++;
}
'''
arena_main='''#include "model.h"
#include <stdio.h>
#include <string.h>
static void frame(const Arena *s,char action){printf("{\\"type\\":\\"frame\\",\\"tick\\":%u,\\"action\\":\\"%c\\",\\"player\\":%d,\\"health\\":%d,\\"cooldown\\":%u,\\"waves\\":%u,\\"score\\":%u,\\"fired\\":%s,\\"hit\\":%s,\\"won\\":%s,\\"enemies\\":[",s->tick,action,s->player,s->health,s->cooldown,s->waves,s->score,s->fired?"true":"false",s->hit?"true":"false",s->won?"true":"false");for(unsigned i=0;i<s->count;i++)printf("%s{\\"x\\":%d,\\"y\\":%d}",i?",":"",s->enemies[i].x,s->enemies[i].y);puts("]}");}
static void draw(const Arena *s){puts("\\nWave Arena: a/d move, f fires, . waits; Enter after each action; q quits.");for(int y=0;y<HEIGHT;y++){putchar('|');for(int x=0;x<WIDTH;x++){char cell='.';for(unsigned i=0;i<s->count;i++)if(s->enemies[i].x==x&&s->enemies[i].y==y)cell='V';if(y==HEIGHT-1&&s->player==x)cell='A';putchar(cell);}puts("|");}printf("Health %d | score %u/3 | cooldown %u | waves %u | tick %u | %s\\n",s->health,s->score,s->cooldown,s->waves,s->tick,s->won?"YOU WIN":s->health<=0?"GAME OVER":s->hit?"Enemy hit":s->fired?"Shot fired":"Ready for input");}
int main(int argc,char **argv){Arena s=arena_initial();if(argc==3&&strcmp(argv[1],"--replay")==0){puts("{\\"type\\":\\"header\\",\\"project\\":\\"wave-arena\\",\\"version\\":1,\\"language\\":\\"LANGUAGE\\"}");frame(&s,'.');for(const char*p=argv[2];*p&&!s.won&&s.health>0;p++){if(!strchr("adf.",*p)){fputs("Replay actions must use a/d/f/.\\n",stderr);return 2;}arena_step(&s,*p);frame(&s,*p);}return 0;}if(argc!=1){fputs("Usage: game [--replay ACTIONS]\\n",stderr);return 2;}draw(&s);int action;while(!s.won&&s.health>0&&(action=getchar())!=EOF){if(action=='q')break;if(!strchr("adf.",action))continue;arena_step(&s,(char)action);draw(&s);}return 0;}
'''
arena_tests='''#include "model.h"
#include <stdio.h>
#define CHECK(condition,name) do {if(!(condition)){fprintf(stderr,"FAIL %s\\n",name);return 1;}printf("PASS %s\\n",name);}while(0)
int main(void){
    Arena s=arena_initial();arena_step(&s,'f');CHECK(s.fired&&s.cooldown==3,"first shot starts the cooldown");arena_step(&s,'f');CHECK(!s.fired&&s.cooldown==2,"cooldown blocks consecutive shots");arena_step(&s,'f');CHECK(!s.fired&&s.cooldown==1,"cooldown remains active for two intervening ticks");arena_step(&s,'f');CHECK(s.fired&&s.cooldown==3,"shot is ready after exactly three ticks");
    s=arena_initial();for(int i=0;i<3;i++)arena_step(&s,'.');CHECK(s.count==0,"no premature wave");arena_step(&s,'.');CHECK(s.count==1&&s.enemies[0].x==4&&s.enemies[0].y==0&&s.waves==1,"wave spawns at tick four without moving immediately");arena_step(&s,'.');CHECK(s.enemies[0].y==1,"enemy advances once per native tick");for(int i=0;i<3;i++)arena_step(&s,'.');CHECK(s.health==2&&s.count==1&&s.enemies[0].x==2&&s.enemies[0].y==0,"escaping enemy damages health and next wave alternates columns");
    s=arena_initial();s.count=2;s.enemies[0].x=4;s.enemies[0].y=1;s.enemies[1].x=4;s.enemies[1].y=3;arena_step(&s,'f');CHECK(s.score==1&&s.hit&&s.count==1&&s.enemies[0].y==2&&s.health==3,"shot chooses nearest enemy and survivors move");
    s=arena_initial();for(int i=0;i<12;i++)arena_step(&s,'a');CHECK(s.player==0,"player movement clamps to arena bounds");
    s=arena_initial();const char *route="....faa.fddddf";while(*route)arena_step(&s,*route++);CHECK(s.won&&s.score==3&&s.health==3,"native arena has a playable winning route");unsigned tick=s.tick;arena_step(&s,'a');CHECK(s.won&&s.tick==tick,"won state does not advance");
    s=arena_initial();for(int i=0;i<16;i++)arena_step(&s,'.');CHECK(s.health==0&&!s.won,"unopposed waves cause a real loss");tick=s.tick;arena_step(&s,'f');CHECK(s.tick==tick&&!s.fired,"lost state does not advance");
    puts("Named cooldown/wave/enemy/gameplay scenarios complete.");return 0;
}
'''
arena_explanation='Update order matters: player movement, cooldown decrement, optional shot, enemy movement/damage, tick increment, scheduled spawn, win check. The nearest target is the enemy with the greatest row in the player column. Remove it before advancing enemies so a successful shot prevents that enemy from reaching the player row. Shift remaining enemies when removing to preserve deterministic ordering. Spawning after movement keeps a new enemy at row zero for its first exported frame. Both interactive play and --replay call this same learner function; there is no browser copy of the rules.'
for lang in ['c','cpp']:
 header='model.h' if lang=='c' else 'model.hpp'
 emit('wave-arena',lang,arena_starter.replace('model.h',header),arena_solution.replace('model.h',header),arena_model,arena_main.replace('model.h',header).replace('LANGUAGE',lang),arena_tests.replace('model.h',header),arena_explanation,arena_meta)
arena_zmodel='''pub const width=9;pub const height=5;pub const max_enemies=8;
pub const Enemy=struct{x:i32=0,y:i32=0};
// Fixed-capacity storage belongs to the Arena value; callbacks borrow a mutable pointer.
pub const Arena=struct{player:i32=4,health:i32=3,tick:u32=0,cooldown:u32=0,waves:u32=0,score:u32=0,count:usize=0,fired:bool=false,hit:bool=false,won:bool=false,enemies:[8]Enemy=.{.{},.{},.{},.{},.{},.{},.{},.{}}};
pub fn arena_initial() Arena{return .{};}
'''
arena_zsolution='''const m=@import("model.zig");
fn remove_enemy(s:*m.Arena,i:usize) void{var j=i+1;while(j<s.count):(j+=1)s.enemies[j-1]=s.enemies[j];s.count-=1;}
pub fn arena_step(s:*m.Arena,action:u8) void{
    if(s.won or s.health<=0)return;s.fired=false;s.hit=false;
    if(action=='a' and s.player>0)s.player-=1;
    if(action=='d' and s.player<m.width-1)s.player+=1;
    if(s.cooldown>0)s.cooldown-=1;
    if(action=='f' and s.cooldown==0){s.fired=true;s.cooldown=3;var target:?usize=null;for(s.enemies[0..s.count],0..) |enemy,i| {if(enemy.x==s.player and (target==null or enemy.y>s.enemies[target.?].y))target=i;}if(target) |i| {remove_enemy(s,i);s.score+=1;s.hit=true;}}
    var i:usize=0;while(i<s.count){s.enemies[i].y+=1;if(s.enemies[i].y>=m.height-1){remove_enemy(s,i);if(s.health>0)s.health-=1;}else i+=1;}
    s.tick+=1;
    if(s.health>0 and s.score<3 and s.tick%4==0 and s.count<m.max_enemies){const columns=[_]i32{4,2,6};s.enemies[s.count]=.{.x=columns[s.waves%3],.y=0};s.count+=1;s.waves+=1;}
    s.won=s.health>0 and s.score>=3;
}
'''
arena_zstarter='''const m=@import("model.zig");
// Broken: fire is always ready, but no waves spawn or move.
pub fn arena_step(s:*m.Arena,action:u8) void{if(s.won or s.health<=0)return;if(action=='a' and s.player>0)s.player-=1;if(action=='d' and s.player<m.width-1)s.player+=1;s.cooldown=0;s.fired=action=='f';s.hit=false;s.tick+=1;}
'''
arena_zmain='''const std=@import("std");const m=@import("model.zig");const learner=@import("mechanics.zig");
extern "c" fn printf(format:[*:0]const u8,...) c_int;extern "c" fn getchar() c_int;extern "c" fn putchar(c_int) c_int;extern "c" fn puts([*:0]const u8) c_int;extern "c" fn exit(c_int) noreturn;
fn truth(b:bool) [*:0]const u8{return if(b) "true" else "false";}
fn frame(s:m.Arena,action:u8) void{_=printf("{\\"type\\":\\"frame\\",\\"tick\\":%u,\\"action\\":\\"%c\\",\\"player\\":%d,\\"health\\":%d,\\"cooldown\\":%u,\\"waves\\":%u,\\"score\\":%u,\\"fired\\":%s,\\"hit\\":%s,\\"won\\":%s,\\"enemies\\":[",@as(c_uint,s.tick),@as(c_int,action),@as(c_int,s.player),@as(c_int,s.health),@as(c_uint,s.cooldown),@as(c_uint,s.waves),@as(c_uint,s.score),truth(s.fired),truth(s.hit),truth(s.won));for(s.enemies[0..s.count],0..) |enemy,i|{_=printf("%s{\\"x\\":%d,\\"y\\":%d}",@as([*:0]const u8,if(i==0) "" else ","),@as(c_int,enemy.x),@as(c_int,enemy.y));}_=puts("]}");}
fn draw(s:m.Arena) void{_=puts("\\nWave Arena: a/d move, f fires, . waits; Enter after each action; q quits.");for(0..m.height) |y| {_=putchar('|');for(0..m.width) |x| {var cell:u8='.';for(s.enemies[0..s.count]) |enemy| {if(enemy.x==x and enemy.y==y)cell='V';}if(y==m.height-1 and s.player==x)cell='A';_=putchar(@as(c_int,cell));}_=puts("|");}_=printf("Health %d | score %u/3 | cooldown %u | waves %u | tick %u | %s\\n",@as(c_int,s.health),@as(c_uint,s.score),@as(c_uint,s.cooldown),@as(c_uint,s.waves),@as(c_uint,s.tick),@as([*:0]const u8,if(s.won) "YOU WIN" else if(s.health<=0) "GAME OVER" else if(s.hit) "Enemy hit" else if(s.fired) "Shot fired" else "Ready for input"));}
pub fn main(init:std.process.Init) !void{const args=try init.minimal.args.toSlice(init.arena.allocator());var s=m.arena_initial();if(args.len==3 and std.mem.eql(u8,args[1],"--replay")){_=puts("{\\"type\\":\\"header\\",\\"project\\":\\"wave-arena\\",\\"version\\":1,\\"language\\":\\"zig\\"}");frame(s,'.');for(args[2]) |action|{if(s.won or s.health<=0)break;if(std.mem.indexOfScalar(u8,"adf.",action)==null){_=puts("Replay actions must use a/d/f/.");exit(2);}learner.arena_step(&s,action);frame(s,action);}return;}if(args.len!=1){_=puts("Usage: game [--replay ACTIONS]");exit(2);}draw(s);while(!s.won and s.health>0){const input=getchar();if(input<0 or input=='q')break;if(input>255)continue;const action:u8=@intCast(input);if(std.mem.indexOfScalar(u8,"adf.",action)==null)continue;learner.arena_step(&s,action);draw(s);}}
'''
arena_ztests='''const std=@import("std");const t=std.testing;const m=@import("model.zig");const learner=@import("mechanics.zig");
test "first shot starts cooldown" {var s=m.arena_initial();learner.arena_step(&s,'f');try t.expect(s.fired and s.cooldown==3);}
test "consecutive shots wait exactly three ticks" {var s=m.arena_initial();learner.arena_step(&s,'f');learner.arena_step(&s,'f');try t.expect(!s.fired and s.cooldown==2);learner.arena_step(&s,'f');try t.expect(!s.fired and s.cooldown==1);learner.arena_step(&s,'f');try t.expect(s.fired and s.cooldown==3);}
test "wave spawns at tick four without moving early" {var s=m.arena_initial();for(0..3) |_|learner.arena_step(&s,'.');try t.expect(s.count==0);learner.arena_step(&s,'.');try t.expect(s.count==1 and s.enemies[0].x==4 and s.enemies[0].y==0 and s.waves==1);}
test "surviving enemies advance once per tick" {var s=m.arena_initial();for(0..5) |_|learner.arena_step(&s,'.');try t.expect(s.enemies[0].y==1);}
test "escaping enemy damages health and next wave changes column" {var s=m.arena_initial();for(0..8) |_|learner.arena_step(&s,'.');try t.expect(s.health==2 and s.count==1 and s.enemies[0].x==2 and s.enemies[0].y==0);}
test "shot selects nearest enemy and advances survivors" {var s=m.arena_initial();s.count=2;s.enemies[0]=.{.x=4,.y=1};s.enemies[1]=.{.x=4,.y=3};learner.arena_step(&s,'f');try t.expect(s.score==1 and s.hit and s.count==1 and s.enemies[0].y==2 and s.health==3);}
test "movement is clamped to arena columns" {var s=m.arena_initial();for(0..12) |_|learner.arena_step(&s,'a');try t.expect(s.player==0);}
test "native arena has a playable winning route" {var s=m.arena_initial();for("....faa.fddddf") |a|learner.arena_step(&s,a);try t.expect(s.won and s.score==3 and s.health==3);}
test "won state does not advance" {var s=m.arena_initial();for("....faa.fddddf") |a|learner.arena_step(&s,a);const tick=s.tick;learner.arena_step(&s,'a');try t.expect(s.won and s.tick==tick);}
test "unopposed enemies produce a real loss" {var s=m.arena_initial();for(0..16) |_|learner.arena_step(&s,'.');try t.expect(s.health==0 and !s.won);const tick=s.tick;learner.arena_step(&s,'f');try t.expect(s.tick==tick and !s.fired);}
'''
emit('wave-arena','zig',arena_zstarter,arena_zsolution,arena_zmodel,arena_zmain,arena_ztests,arena_explanation,arena_meta)
projects=[runner_meta,arena_meta]
for p in projects:p.update(version=1,languages=['c','zig','cpp'])
(root/'content/native-projects.js').write_text('/* Native terminal games: learner callbacks drive gameplay and replay export. */\nwindow.NATIVE_PROJECTS = '+json.dumps(dict(version=1,items=projects),ensure_ascii=False,indent=2)+';\n')
