//=============================================================================
// EIS Librarium.js
//=============================================================================

/*:
/*
* @author Kino
* @plugindesc A plugin that allow you to work with books in game.
*
* @param File Name
* @desc The name of the file that holds all of your book files. 
* Should be in your data folder with a ".json" extension.
* @default Librarium
*
* @param Include Background Image
* @desc To Include background image, or not. The background image 
* should be in your picture folder.
* @default F
* 
* @param Background Image
* @desc The background image of the book scene 
* (should placed be in your pictures folder)
* @default Translucent
*
* @help
* Version 1.00
//=============================================================================
// Introduction
//=============================================================================
* This plugin was designed so that developers can have books in their game. It's
* the spiritual successor to KRBook plugin.
* 
* The books in this plugin are designed to be useful and easy to handle / create.
* Furthermore, this plugin supports text codes, improved word wrapping, and 
* graphical backgrounds.
*
//=============================================================================
// Script Calls
//=============================================================================
* SceneManager.startBookScene(title)
* This script call will open the book scene, so that players can view a book
* of your choice. You need to pass the title of your book in quotes.
* Example:
* SceneManager.startBookScene("lilia");
* Titles are not case sensitive.
*
* Librarium.getBookContents(title);
* This script call will return the book contents, which you can store in a 
* variable for example.
* Example:
* Librarium.getBookContents("lilia");
* 
* Librarium.showInMessageWindow(title)
* Shows the book contents in the message window used for showText commands.
* The text doesn't have word wrapping like the scene, so you'll need a plugin
* that supports word wrapping. (Yanfly)
* Example:
* Librarium.showInMessageWindow("lilia");
* 
//=============================================================================
//  Contact Information
//=============================================================================
*
* Contact me via twitter: EISKino, or on the rpg maker forums.
* Username on forums: Kino.
*
* Forum Link: http://forums.rpgmakerweb.com/index.php?/profile/75879-kino/
* Website Link: http://endlessillusoft.com/
* Twitter Link: https://twitter.com/EISKino
* Patreon Link: https://www.patreon.com/EISKino
*
* Hope this plugin helps, and enjoy!
* --Kino
*/


const Librarium = {};

(function($) {
  'use strict';

  function Setup() {
    const params = PluginManager.parameters("EISLibrarium");
    const LibrariumParams = {
      fileName: String(params['File Name']),
      includeBackground: String(params['Include Background Image']),
      backgroundName: String(params['Background Image'])
    };

//=============================================================================
//	LibrariumInitializer
//=============================================================================

    class LibrariumInitializer {
      static initialize() {
        this.prepareLibrarium();
      }

      static prepareLibrarium() {
        Librarium.bookList = LibrariumFS.readLibraryFile();
      }
    }


//=============================================================================
//	LibrariumFS
//=============================================================================
    class LibrariumFS {

      static readLibraryFile() {
        let fileData = null;
        let path = `/data/${LibrariumParams.fileName}.json`;
        path = this.createPath(path);
        fileData = this.system.readFileSync(path, 'utf-8');
        return JsonEx.parse(fileData);
      }

      static createPath(string) {
        let path = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, string);
        if (path.match(/^\/([A-Z]\:)/)) {
          path = path.slice(1);
        }
        path = decodeURIComponent(path);
        return path;
      }
    }

    LibrariumFS.system = require('fs');
//=============================================================================
//	Librarian
//=============================================================================

    class Librarian {

      static setCurrrentBook(title) {
        this.pageNumber = 1;
        this.currentBook = this.getBook(title);
      }

      static getBook(title) {
        let titleRe = new RegExp(title, 'ig');
        let libraryBook = null;
        Librarium.bookList.forEach(function(book){
          if(titleRe.test(book.title)) {
            libraryBook = book;
          }
        });
        return libraryBook;
      }

      static getCurrentBook() {
        return this.currentBook;
      }

      static getCurrentBookPageText() {
        return this.currentBook.pages[this.pageNumber - 1].pageText;
      }

      static getPageNumber() {
        return this.pageNumber;
      }

      static nextPage() {
        this.pageNumber++;
      }

      static prevPage() {
        this.pageNumber--;
      }

      static getBookContents(title) {
        let book = this.getBook(title);
        let bookContents = "";
        for(let i = 0; i < book.pages.length; i++) {
          bookContents += book.pages[i].pageText;
        }
        return bookContents;
      }
    }

    Librarian.currentBook = null;
    Librarian.pageNumber = 1;

//=============================================================================
//	Librarium
//=============================================================================

    const Librarium = {
      bookList: []
    };

//=============================================================================
//	Scene_Book
//=============================================================================

    class Scene_Book extends Scene_Base {
      constructor() {
        super();
      }

      create() {
        if(/T/ig.test(LibrariumParams.includeBackground))
          this.createBackground();
        this.createWindowLayer();
        LayoutCreator.createDefaultLayout(this);
      }

      createBackground() {
        this._bookBackSprite = new Sprite();
        this._bookBackSprite.bitmap = ImageManager.loadPicture(LibrariumParams.backgroundName);
        this.addChild(this._bookBackSprite);
      }

      update() {
        Scene_Base.prototype.update.call(this);
        this.processSceneExit();
      }

      processSceneExit() {
        if(Input.isTriggered('cancel') || TouchInput.isCancelled() ) {
          this.popScene();
        }
      }
    }

//=============================================================================
//	LayoutCreator
//=============================================================================

    class LayoutCreator {
      static createDefaultLayout(scene) {
        scene._titleWindow = new Window_Title(0, 0, Graphics.width, 75);
        scene._windowContent = new Window_Content(0, 75, Graphics.width, Graphics.height - 200);
        scene._windowPageNumber = new Window_SelectPages(0, Graphics.height - 125, Graphics.width, 125);
        scene.addChild(scene._titleWindow);
        scene.addChild(scene._windowContent);
        scene.addChild(scene._windowPageNumber);
      }

      static createBookListLayout(scene) {
        scene._bookListWindow = new Window_BookList(0, 0, 150, Graphics.height);
        scene._titleWindow = new Window_Title(150, 0, Graphics.width - 150, 125);
        scene._windowContent = new Window_Content(150, 125, Graphics.width - 150, Graphics.height - 250);
        scene._windowPageNumber = new Window_SelectPages(150, Graphics.height - 125, Graphics.width - 150, 125);
        scene.addChild(scene._titleWindow);
        scene.addChild(scene._windowContent);
        scene.addChild(scene._windowPageNumber);
      }
    }

//=============================================================================
//	Window_Title
//=============================================================================

    class Window_Title extends Window_Base {
      constructor(x, y, width, height) {
        super(x, y, width, height);
      }

      initialize(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.bookTitle = Librarian.currentBook.title;
      }

      update() {
        Window_Base.prototype.update.call(this);
        this.refresh();
      }

      refresh() {
        if(this.contents) {
          this.contents.clear();
          this.drawTitle();
        }
      }

      drawTitle() {
        this.contents.fontSize = 32;
        let text = this.bookTitle;
        let midPoint = ((this.contentsWidth() / 2) - (this.textWidth(text) / 2));
        this.drawText(text, midPoint, 0, this.width);
        this.resetFontSettings();
      }

    }
//=============================================================================
//	Window_Booklist
//=============================================================================

    class Window_BookList extends Window_Selectable {
      constructor(x, y, width ,height) {
        super(x, y, width, height);
      }

      initialize(x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.bookList = Librarium.bookList;
        this.select(0);
        this.activate();
      }

      maxItems() {
        return this.bookList.length;
      }

      update() {
        Window_Selectable.prototype.update.call(this);
        this.refresh();
      }

      drawItem(index) {
        let rect = this.itemRectForText(index);
        let bookTitle = this.bookList[index].title;
        this.drawText(bookTitle, rect.x, rect.y, rect.width);
      }
    }

//=============================================================================
//	Window_Content
//=============================================================================

    class Window_Content extends Window_Base {
      constructor(x, y, width, height) {
        super(x, y, width, height);
      }

      initialize(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.book = Librarian.currentBook;
        this.currentWord = [];
        this.wordShiftAmount = 0;
      }

      update() {
        Window_Base.prototype.update.call(this);
        this.refresh();
      }

      refresh() {
        if(this.contents) {
          this.contents.clear();
          this.drawBookCotents();
          this.drawPageNumber();
        }
      }

      drawBookCotents() {
        this.drawTextEx(`${Librarian.getCurrentBookPageText()}`, 0, 12);
      }

      drawPageNumber() {
        this.contents.fontSize = 32;
        let text = `${Librarian.getPageNumber()} / ${this.book.pages.length}`;
        this.drawText(text, (this.contentsWidth() - this.textWidth(text)), this.contentsHeight() - 40, 100);
        this.resetFontSettings();
      }

      drawTextEx(text, x, y) {
        if (text) {
          let textState = { index: 0, x: x, y: y, left: x };
          textState.text = this.convertEscapeCharacters(text);
          textState.height = this.calcTextHeight(textState, false);
          this.resetFontSettings();
          this.wordShiftAmount = textState.left;
          this.currentWord.length = 0;
          while (textState.index < textState.text.length) {
            this.processCharacter(textState);
          }
          return textState.x - x;
        } else {
          return 0;
        }
      }

      processNormalCharacter(textState) {
        let char = textState.text[textState.index++];
        let charWidth = this.textWidth(char);

        if(/\w/ig.test(char)) {
          this.updateWordArray(char, textState);
        }
        else if((/\s/ig.test(char) || /[\W]/ig.test(char)) && this.currentWord.length > 0) {
          let word = this.createWord(this.currentWord);
          let firstLetter = this.currentWord[0];
          let wordWidth = this.textWidth(word);

          if(firstLetter.x + wordWidth > this.contentsWidth()){
            this.updateTextStateAndShiftAmount(firstLetter, wordWidth, textState);
          }
          this.contents.drawText(word+char, firstLetter.x, firstLetter.y,  wordWidth * 2, firstLetter.align);
          this.currentWord.length = 0;
        }
        textState.x += charWidth;
      }

      updateWordArray(char, textState) {
        let x = this.currentWord.length === 0 ? (this.wordShiftAmount + textState.x) : textState.x;
        let charWidth = this.textWidth(char);
        this.currentWord.push({char, x, y: textState.y, width: charWidth * 2, align: textState.height});
      }

      createWord(letterArray) {
        let word = letterArray.map(function(element){
            return element.char;
          });
        return word.join("");
      }

      updateTextStateAndShiftAmount(firstLetter, wordWidth, textState) {
        textState.x = textState.left;
        textState.y += textState.height;
        firstLetter.x = textState.x;
        firstLetter.y = textState.y;
        firstLetter.align = textState.height;
        this.wordShiftAmount = firstLetter.x + wordWidth;
      }
    }
//=============================================================================
//	  Window_SelectPages
//=============================================================================

    class Window_SelectPages extends Window_Selectable {
      constructor(x, y, width, height) {
        super(x, y, width, height);
      }

      initialize(x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.book = Librarian.currentBook;
      }

      update() {
        Window_Selectable.prototype.update.call(this);
        this.updatePageNumber();
        this.refresh();
      }

      updatePageNumber() {
        let pageNumber = 0;
        if(Input.isTriggered('right')) {
          if(Librarian.getPageNumber() < this.book.pages.length)
            Librarian.nextPage();
        }
        if(Input.isTriggered('left')) {
          if(Librarian.getPageNumber() > 1)
            Librarian.prevPage();
        }
      }
    }

    LibrariumInitializer.initialize();

//=============================================================================
//	Public API
//=============================================================================
    SceneManager.startBookScene = function(bookTitle) {
      Librarian.setCurrrentBook(bookTitle);
      this.push(Scene_Book);
    };

    $.getBook = function(string) {
      return Librarian.getBook(string);
    };

    $.getBookContents = function(string) {
      return Librarian.getBookContents(string);
    };

    $.showBookInMessageWindow = function(string) {
      let contents = Librarian.getBookContents(string);
      $gameMessage.add(contents);
    };
  }


  Setup();
})(Librarium);
