
  def mock_users(stubs={})
    @user ||= mock_model(User, stubs).as_null_object
  end

  def login_test_user
    attr = { :username => "Foobar", :email => "doineedit@foobar.com" }
    #mock up an authentication in warden as per http://www.michaelharrison.ws/weblog/?p=349
    request.env['warden'] = mock(Warden, :authenticate => mock_users(attr),
                                 :authenticate! => mock_users(attr),
                                 :authenticate? => mock_users(attr))
  end
