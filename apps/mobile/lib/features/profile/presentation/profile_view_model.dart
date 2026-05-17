import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/user_profile_repository.dart';
import '../../../providers.dart';

class ProfileController extends StateNotifier<bool> {
  ProfileController(this._ref) : super(false) {
    _repo = _ref.read(userProfileRepositoryProvider);
  }

  final Ref _ref;
  late final UserProfileRepository _repo;

  Future<void> togglePrivacy(bool enabled) async {
    state = true;
    try {
      await _repo.togglePrivacyMode(enabled);
      _ref.invalidate(userProfileProvider);
    } finally {
      state = false;
    }
  }

  Future<void> resetProfile() async {
    state = true;
    try {
      await _repo.clearProfile();
      _ref.invalidate(userProfileProvider);
    } finally {
      state = false;
    }
  }
}
