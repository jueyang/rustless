// clarify this.props, this.state, this.refs
var converter = new Showdown.converter();

// hardcoded data <-- static json <-- server
// great way of understanding transmittion!

// var data = [
//   {author:"Pete",text:"Comment 1"},
//   {author:"Jordan",text:"Comment 2"}
// ];

var Comment = React.createClass({ // reflected in a xml-like <Comment author="who">content</Comment>
  render: function() {
    var rawMarkup = converter.makeHtml(this.props.children.toString()); // within render function
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function(comment){ // mapping json data pass from the data varible -- CommentBox to CommentList
      return (
        <Comment author={comment.author}>
          {comment.text}
        </Comment>
      );
    })
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({

  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.refs.author.getDOMNode().value.trim();
    var text = this.refs.text.getDOMNode().value.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.refs.author.getDOMNode().value = '';
    this.refs.text.getDOMNode().value = '';
  },
  render: function() {
    // ref is defined here in the UI
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your name" ref="author" />
        <input type="text" placeholder="Say something..." ref="text" />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function(){
    $.ajax({
      url:this.props.url, //comments.json
      dataType:"json",
      success: function(data){
        // this is key. Magic happens here.
        // We replace the old array of comments with the new one from the server and the UI automatically updates itself. 
        this.setState({data: data});
      }.bind(this), // specific to the scope
      error: function(xhr, status, err){
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  // pass data from the child component (CommentForm) back up to its parent
  handleCommentSubmit: function(comment){
    // optimize data load
    var comments = this.state.data;
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});

    console.log(comments,comment);
    $.ajax({
      url: this.props.url,
      dataType: "json",
      type: "POST", // submit to the server and refresh the list
      data: comment,
      success: function(data){
        console.log(data);
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err){
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    });
  },
  // this.state is private to the component and can be changed by calling this.setState(). When the state is updated, the component re-renders itself.
  getInitialState: function(){
    return {data: []};
  },
  // componentDidMount is a method called automatically by React when a component is rendered
  componentDidMount: function(){
    this.loadCommentsFromServer();
    // We will use simple polling here but you could easily use WebSockets or other technologies.
    setInterval(this.loadCommentsFromServer,this.props.pollInterval);
  },
  render:function(){
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data}/>
        <CommentForm onCommentSubmit={this.handleCommentSubmit}/>
      </div>
    );
  }
});

React.render(
  <CommentBox url="comments.json" pollInterval={2000} />,
  document.getElementById("content")
);
